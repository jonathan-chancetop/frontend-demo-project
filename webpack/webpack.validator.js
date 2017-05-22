import fs from "fs";
import path from "path";
import glob from "glob";

const errors = [];

function assertFileExists(relativePath, key) {
    const absolutePath = path.resolve(__dirname, relativePath);
    if (!fs.existsSync(absolutePath)) {
        errors.push(`${key} => file does not exist, path=${absolutePath}`);
    }
}

function assertDirExists(relativePath, key) {
    const absolutePath = path.resolve(__dirname, relativePath);
    if (!fs.existsSync(absolutePath)) {
        errors.push(`${key} => path does not exist, path=${absolutePath}`);
        return false;
    }
    if (!fs.statSync(absolutePath).isDirectory()) {
        errors.push(`${key} => path is not directory, path=${absolutePath}`);
        return false;
    }
    return true;
}

function validateLib(config, usedLib) {
    Object.keys(config.lib).forEach(lib => {
        if (!usedLib.has(lib)) {
            errors.push(`config.lib["${lib}"] => lib is not used by any page, lib=${lib}`);
        }
    });
}

function validatePages(config, usedLib) {
    Object.keys(config.pages).forEach(pageName => {
        const page = config.pages[pageName];
        assertFileExists(`../src/${page.js}`, `config.pages["${pageName}"].js`);
        assertFileExists(`../src/${page.template}`, `config.pages["${pageName}"].template`);

        page.lib.forEach(lib => {
            if (config.lib[lib] === undefined) {
                errors.push(`config.pages["${pageName}"].lib => lib is not defined in config.lib, lib=${lib}`);
            } else {
                usedLib.add(lib);
            }
        });
    });
}

function validateSprite(config) {
    if (config.sprite === undefined) {
        return;
    }
    Object.keys(config.sprite).forEach(sprite => {
        const imageDir = path.resolve(__dirname, `../src/${config.sprite[sprite]}`);
        const dirExists = assertDirExists(`../src/${config.sprite[sprite]}`, `config.sprite["${sprite}"]`);
        if (dirExists) {
            const images = glob.sync("**/*.png", {cwd: imageDir});
            if (images.length === 0) {
                errors.push(`config.sprite["${sprite}"] => image dir does not contain any png image, path=${imageDir}`);
            }
        }
    });
}


function validateSys(env, config) {
    if (config.sys === undefined) {
        return;
    }
    assertFileExists(`../conf/${env}/${config.sys}`, "config.sys");
}

function validateLint(config) {
    if (config.lint === undefined || config.lint.exclude === undefined) {
        return;
    }
    assertDirExists(`../src/${config.lint.exclude}`, "config.lint.exclude");
}

export const validate = (env, config, production) => {
    const usedLib = new Set();

    validatePages(config, usedLib);
    validateLib(config, usedLib);
    validateSprite(config);

    if (production) {
        validateSys(env, config);
        validateLint(config);
    }

    if (errors.length > 0) {
        console.error("validation failed, please fix the following errors");
        errors.forEach(error => {
            console.error("    ", error);
        });
        console.log();
        process.exit(1);
    }
};
