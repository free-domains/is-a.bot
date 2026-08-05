import t from "ava";
import fs from "fs-extra";
import path from "path";

const domainsPath = path.resolve("domains");
const files = fs.readdirSync(domainsPath).filter((file) => file.endsWith(".json"));

const domainCache = {};

function getDomainData(subdomain) {
    if (domainCache[subdomain]) {
        return domainCache[subdomain];
    }

    try {
        const data = fs.readJsonSync(path.join(domainsPath, `${subdomain}.json`));
        domainCache[subdomain] = data; // Cache the domain data
        return data;
    } catch (error) {
        throw new Error(`Failed to read JSON for ${subdomain}: ${error.message}`);
    }
}

t("Nested subdomains should not exist without a parent subdomain", (t) => {
    files.forEach((file) => {
        const subdomain = file.replace(/\.json$/, "");
        const parts = subdomain.split(".");

        for (let i = 1; i < parts.length; i++) {
            const parent = parts.slice(i).join(".");
            if (parent.startsWith("_")) continue;

            t.true(files.includes(`${parent}.json`), `${file}: Parent subdomain "${parent}" does not exist`);
        }
    });

    t.pass();
});

t("Nested subdomains should not exist if any parent subdomain has NS records", (t) => {
    files.forEach((file) => {
        const subdomain = file.replace(/\.json$/, "");
        const parts = subdomain.split(".");

        for (let i = 1; i < parts.length; i++) {
            const parent = parts.slice(i).join(".");
            if (parent.startsWith("_") || !files.includes(`${parent}.json`)) continue;
            const parentData = getDomainData(parent);

            t.true(!parentData.records.NS, `${file}: Parent subdomain "${parent}" has NS records`);
        }
    });

    t.pass();
});

t("Nested subdomains should be owned by the parent subdomain's owner", (t) => {
    files.forEach((file) => {
        const subdomain = file.replace(/\.json$/, "");
        const parentDomain = subdomain.split(".").reverse()[0];

        if (parentDomain !== subdomain) {
            const data = getDomainData(subdomain);
            const parentData = getDomainData(parentDomain);

            t.true(
                data.owner.username.toLowerCase() === parentData.owner.username.toLowerCase(),
                `${file}: Owner does not match the parent subdomain`
            );
        }
    });

    t.pass();
});
