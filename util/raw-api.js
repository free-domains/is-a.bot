import fs from "fs";
import path from "path";

import internal from "./internal.json" with { type: "json" };
import reserved from "./reserved.json" with { type: "json" };

const directoryPath = "./domains";
const outputDir = "./raw-api";
const domainsOutputDir = path.join(outputDir, "v1", "domains");

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}
if (!fs.existsSync(domainsOutputDir)) {
    fs.mkdirSync(domainsOutputDir, { recursive: true });
}

function writeDomainFile(entry) {
    fs.writeFileSync(
        path.join(domainsOutputDir, `${entry.subdomain}.json`),
        JSON.stringify(entry)
    );
}

const v1 = [];

for (const subdomain of internal) {
    const entry = {
        domain: `${subdomain}.is-a.bot`,
        subdomain: subdomain,
        owner: { username: "free-domains" },
        records: { CNAME: "internal.is-a.bot" },
        internal: true
    };
    v1.push(entry);
    writeDomainFile(entry);
}

for (const subdomain of reserved) {
    const entry = {
        domain: `${subdomain}.is-a.bot`,
        subdomain: subdomain,
        owner: { username: "free-domains" },
        records: { URL: "https://is-a.bot/reserved" },
        reserved: true
    };
    v1.push(entry);
    writeDomainFile(entry);
}

fs.readdir(directoryPath, function (err, files) {
    if (err) throw err;

    let processedCount = 0;

    files.forEach(function (file) {
        const filePath = path.join(directoryPath, file);

        fs.readFile(filePath, "utf8", (err, data) => {
            if (err) throw err;

            const item = JSON.parse(data);
            const name = path.parse(file).name;

            item.domain = `${name}.is-a.bot`;
            item.subdomain = name;
            delete item.owner.email;

            const itemv1 = {
                domain: item.domain,
                subdomain: item.subdomain,
                owner: item.owner,
                records: item.records
            };
            // if (item.redirect_config) itemv1.redirect_config = item.redirect_config;
            if (item.proxied) itemv1.proxied = item.proxied;

            v1.push(itemv1);
            writeDomainFile(itemv1);

            processedCount++;
            if (processedCount === files.length) {
                v1.sort((a, b) => a.domain.localeCompare(b.subdomain));
                fs.writeFile(
                    path.join(outputDir, "v1.json"),
                    JSON.stringify(v1),
                    (err) => { if (err) throw err; }
                );
            }
        });
    });
});
