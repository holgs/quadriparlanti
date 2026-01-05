const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Read .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
    console.error('.env.local not found');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
        }
        envVars[key] = value;
    }
});

const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
const key = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error('Missing Supabase URL or Key in .env.local');
    process.exit(1);
}

console.log(`Targeting Supabase URL: ${url}`);

// 2. Connect
const supabase = createClient(url, key);

// 3. Test Connection
async function check() {
    console.log('Attempting to connect to Supabase...');

    // Try to list schemas or just a common table
    const { data: themes, error: themesError } = await supabase.from('themes').select('id').limit(1);

    if (themesError) {
        console.error('❌ Connection Check Failed:', themesError.message);
        if (themesError.code) console.error('Error Code:', themesError.code);
    } else {
        console.log('✅ Connection Successful!');

        const { count: worksCount } = await supabase.from('works').select('*', { count: 'exact', head: true });
        const { count: themesCount } = await supabase.from('themes').select('*', { count: 'exact', head: true });

        console.log('\nDatabase Status:');
        console.log(`- URL: ${url}`);
        console.log(`- Works Table: ${worksCount !== null ? worksCount + ' entries' : 'Accessible'}`);
        console.log(`- Themes Table: ${themesCount !== null ? themesCount + ' entries' : 'Accessible'}`);
    }
}

check();
