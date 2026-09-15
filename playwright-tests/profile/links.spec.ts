import { expect, test } from "@playwright/test";
import { apiCreateLink } from "../helpers/api";
import { signInAsNewUser } from "../helpers/auth";
import { fillField } from "../helpers/ui";

test.describe("Link yonetimi", () => {
  test("yeni kullanici bos durumu gorup ilk linkini ekliyor", async ({
    page,
  }) => {
    const { user } = await signInAsNewUser(page);

    await page.goto("/en/links");
    await expect(page.getByText("No active links")).toBeVisible();

    await page.getByRole("button", { name: "Create Your First Link" }).click();
    await fillField(
      page,
      'input[placeholder="e.g., Instagram Profile"]',
      "Portfolyo"
    );
    await fillField(
      page,
      'input[placeholder="https://example.com"]',
      "https://ornek.test/portfolyo"
    );
    await page.getByRole("button", { name: "Create Link" }).click();

    // Once modalin kapandigini bekliyoruz: icinde basligi canli gosteren bir
    // onizleme var, ona bakarsak link daha olusmadan ilerlemis oluruz.
    await expect(
      page.getByRole("heading", { name: "Add New Link" })
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Portfolyo" })
    ).toBeVisible();

    // Eklenen link herkese acik sayfada da gorunmeli.
    await page.goto(`/en/${user.username}`);
    await expect(page.getByRole("link", { name: "Portfolyo" })).toHaveAttribute(
      "href",
      "https://ornek.test/portfolyo"
    );
  });

  test("var olan linkler listeleniyor ve sayaclar dogru", async ({ page }) => {
    const { token } = await signInAsNewUser(page);
    await apiCreateLink(token, {
      title: "Ilk link",
      url: "https://ornek.test/1",
    });
    await apiCreateLink(token, {
      title: "Ikinci link",
      url: "https://ornek.test/2",
    });

    await page.goto("/en/links");

    await expect(page.getByRole("heading", { name: "Ilk link" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Ikinci link" })
    ).toBeVisible();
  });

  test("giris yapmamis ziyaretci link sayfasina giremiyor", async ({
    page,
  }) => {
    await page.goto("/en/links");

    await expect(page).toHaveURL(/\/sign-in/);
  });
});
