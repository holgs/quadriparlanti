/**
 * QR Code Server Actions
 * Generate and manage QR codes for themes
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import QRCode from 'qrcode';
import { generateShortCode } from '@/lib/utils';

/**
 * Generate QR code for a theme
 * Creates a short code, generates QR image, and stores metadata
 *
 * @param themeId - Theme UUID
 * @returns QR code data with image URL
 */
export async function generateQRCode(themeId: string) {
  try {
    const supabase = await createClient();

    // Verify user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Non autenticato' };
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return { success: false, error: 'Permessi insufficienti' };
    }

    // Generate unique short code
    let shortCode = generateShortCode();
    let attempts = 0;

    // Ensure uniqueness (database has unique constraint, but check first)
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from('qr_codes')
        .select('id')
        .eq('short_code', shortCode)
        .single();

      if (!existing) break;

      shortCode = generateShortCode();
      attempts++;
    }

    if (attempts >= 10) {
      return { success: false, error: 'Impossibile generare un codice univoco' };
    }

    // Create QR code record
    const { data: qrCode, error: qrError } = await supabase
      .from('qr_codes')
      .insert({
        theme_id: themeId,
        short_code: shortCode,
        is_active: true,
      })
      .select()
      .single();

    if (qrError || !qrCode) {
      console.error('QR code creation error:', qrError);
      return { success: false, error: 'Errore durante la creazione del codice QR' };
    }

    // Generate QR code image
    const qrUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/q/${shortCode}`;
    const qrImageBuffer = await QRCode.toBuffer(qrUrl, {
      errorCorrectionLevel: 'M',
      type: 'png',
      width: 512,
      margin: 2,
    });

    // Upload to Supabase Storage
    const fileName = `${shortCode}.png`;
    const { error: uploadError } = await supabase.storage
      .from('qr-codes')
      .upload(fileName, qrImageBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('QR code upload error:', uploadError);
      // Don't fail the operation - QR can still be generated dynamically
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('qr-codes')
      .getPublicUrl(fileName);

    revalidatePath('/admin/qr');

    return {
      success: true,
      data: {
        ...qrCode,
        qr_url: qrUrl,
        image_url: publicUrl,
      },
    };
  } catch (error) {
    console.error('Generate QR code error:', error);
    return { success: false, error: 'Errore durante la generazione del codice QR' };
  }
}

/**
 * Toggle QR code active status
 * Deactivate or reactivate a QR code
 *
 * @param qrCodeId - QR code UUID
 * @param isActive - New active status
 */
export async function toggleQRCodeStatus(qrCodeId: string, isActive: boolean) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('qr_codes')
      .update({ is_active: isActive })
      .eq('id', qrCodeId)
      .select()
      .single();

    if (error) {
      console.error('Toggle QR status error:', error);
      return { success: false, error: 'Errore durante l\'aggiornamento' };
    }

    revalidatePath('/admin/qr');

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Toggle QR status error:', error);
    return { success: false, error: 'Errore durante l\'aggiornamento' };
  }
}

/**
 * Get QR codes by theme
 *
 * @param themeId - Theme UUID
 */
export async function getQRCodesByTheme(themeId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('qr_codes')
      .select(`
        *,
        themes (
          id,
          title_it,
          slug
        )
      `)
      .eq('theme_id', themeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get QR codes error:', error);
      return { success: false, error: 'Errore durante il caricamento', data: [] };
    }

    // Add URLs to each QR code
    const qrCodesWithUrls = data?.map((qr) => ({
      ...qr,
      qr_url: `${process.env.NEXT_PUBLIC_SITE_URL}/q/${qr.short_code}`,
      image_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/qr-codes/${qr.short_code}.png`,
    })) || [];

    return {
      success: true,
      data: qrCodesWithUrls,
    };
  } catch (error) {
    console.error('Get QR codes error:', error);
    return { success: false, error: 'Errore durante il caricamento', data: [] };
  }
}

/**
 * Get all QR codes (admin only)
 */
export async function getAllQRCodes() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('qr_codes')
      .select(`
        *,
        themes (
          id,
          title_it,
          slug,
          status
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get all QR codes error:', error);
      return { success: false, error: 'Errore durante il caricamento', data: [] };
    }

    // Add URLs to each QR code
    const qrCodesWithUrls = data?.map((qr) => ({
      ...qr,
      qr_url: `${process.env.NEXT_PUBLIC_SITE_URL}/q/${qr.short_code}`,
      image_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/qr-codes/${qr.short_code}.png`,
    })) || [];

    return {
      success: true,
      data: qrCodesWithUrls,
    };
  } catch (error) {
    console.error('Get all QR codes error:', error);
    return { success: false, error: 'Errore durante il caricamento', data: [] };
  }
}

/**
 * Delete QR code
 * Removes QR code and its image from storage
 *
 * @param qrCodeId - QR code UUID
 */
export async function deleteQRCode(qrCodeId: string) {
  try {
    const supabase = await createClient();

    // Get short code for deleting image
    const { data: qrCode } = await supabase
      .from('qr_codes')
      .select('short_code')
      .eq('id', qrCodeId)
      .single();

    if (qrCode) {
      // Delete image from storage
      await supabase.storage
        .from('qr-codes')
        .remove([`${qrCode.short_code}.png`]);
    }

    // Delete QR code record
    const { error } = await supabase
      .from('qr_codes')
      .delete()
      .eq('id', qrCodeId);

    if (error) {
      console.error('Delete QR code error:', error);
      return { success: false, error: 'Errore durante l\'eliminazione' };
    }

    revalidatePath('/admin/qr');

    return { success: true };
  } catch (error) {
    console.error('Delete QR code error:', error);
    return { success: false, error: 'Errore durante l\'eliminazione' };
  }
}
