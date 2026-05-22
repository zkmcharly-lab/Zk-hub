const fs = require('fs');
const readline = require('readline');

async function processFile() {
    const inputStream = fs.createReadStream('zkhub_backup (1).sql', 'utf8');
    const outputStream = fs.createWriteStream('zkhub_clean.sql', 'utf8');

    const rl = readline.createInterface({
        input: inputStream,
        crlfDelay: Infinity
    });

    let inCopyBlock = false;
    let currentTable = '';
    let currentCols = '';

    for await (const line of rl) {
        // Skip psql meta-commands at root
        if (!inCopyBlock && line.startsWith('\\')) {
            continue;
        }

        if (line.startsWith('COPY public.')) {
            // COPY public.table (col1, col2) FROM stdin;
            const match = line.match(/COPY public\.([^\s]+) \((.+?)\) FROM stdin;/);
            if (match) {
                inCopyBlock = true;
                currentTable = match[1];
                currentCols = match[2];
                continue;
            }
        }

        if (inCopyBlock) {
            if (line === '\\.') {
                inCopyBlock = false;
                continue;
            }

            if (line.trim() === '') continue;

            // Process data line
            // Values are tab-separated
            const values = line.split('\t').map(val => {
                if (val === '\\N') return 'NULL';
                // Escape single quotes
                let escaped = val.replace(/'/g, "''");
                return `'${escaped}'`;
            });

            const insertStmt = `INSERT INTO public.${currentTable} (${currentCols}) VALUES (${values.join(', ')});\n`;
            outputStream.write(insertStmt);
        } else {
            // Normal SQL line
            outputStream.write(line + '\n');
        }
    }

    outputStream.end();
    console.log("Conversión completada. Archivo generado: zkhub_clean.sql");
}

processFile().catch(console.error);
