const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const {executablePath} = require('puppeteer');

async function launchBrowser(headless=true) {
    return puppeteer.launch({
        headless,
        defaultViewport: null,
        args: [
            "--disable-dev-shm-usage",
            "--shm-size=1gb",
            '--no-sandbox',
            '--disable-setuid-sandbox',
        ],
        executablePath: executablePath(),
    });
}

async function getPage(browser) {
    let page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.63 Safari/537.36")
    return page
}

async function closeBrowser(browser) {
    let pages = await browser.pages()
    await Promise.all(pages.map(page => page.close()))
    return browser.close();
}

async function getCookies(page, domains = []) {
    const cookieArrays = await Promise.all([
        page.cookies(),
        ...domains.map(domain => page.cookies(domain))
    ]);
    return Object.values([].concat(...cookieArrays).map(el => {
        el.name = el.name.replace('__', '')
        el = {
            'name': el.name,
            'value': el.value,
            'domain': el.domain
        }
        return el
    }))
}
async function setCookiesOnPage(page,cookiesArr = []) {
    return page.setCookie(...cookiesArr).then(() => page);
}
module.exports = {launchBrowser, closeBrowser, getPage, getCookies, setCookiesOnPage};
