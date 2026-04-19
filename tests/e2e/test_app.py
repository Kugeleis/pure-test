import unittest
import re
from playwright.sync_api import sync_playwright, expect

class TestE2E(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(headless=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def setUp(self):
        self.context = self.browser.new_context()
        self.page = self.context.new_page()
        self.page.goto("http://localhost:8000")
        self.page.wait_for_selector("#item-grid .card")

    def tearDown(self):
        self.context.close()

    def test_search(self):
        search_input = self.page.locator("#search-input input")
        search_input.fill("Essence")
        self.page.wait_for_timeout(500) # Wait for search to trigger
        expect(self.page.locator("#item-grid .card")).to_have_count(1)
        expect(self.page.locator(".card-title").first).to_contain_text("Essence Mascara Lash Princess")

    def test_filter_category(self):
        category_select = self.page.locator("#filter-category")
        category_select.click()
        self.page.locator("sl-option[value='beauty']").click()
        self.page.wait_for_timeout(500)
        expect(self.page.locator("#results-info")).to_contain_text("Produkte von 100 gefunden")

    def test_reset_button(self):
        search_input = self.page.locator("#search-input input")
        search_input.fill("nonexistent")
        self.page.wait_for_timeout(500)
        expect(self.page.locator("#item-grid .card")).to_have_count(0)

        self.page.locator("#reset-button").click()
        self.page.wait_for_timeout(500)
        expect(self.page.locator("#item-grid .card")).to_have_count(100)
        expect(search_input).to_have_value("")

    def test_theme_switch(self):
        html = self.page.locator("html")
        expect(html).to_have_class(re.compile(r"sl-theme-light"))

        self.page.locator("#theme-switcher").click()
        self.page.locator("sl-menu-item[value='dark']").click()

        expect(html).to_have_class(re.compile(r"sl-theme-dark"))

        # Verify persistence
        self.page.reload()
        self.page.wait_for_selector("#item-grid .card")
        expect(html).to_have_class(re.compile(r"sl-theme-dark"))

if __name__ == "__main__":
    unittest.main()
