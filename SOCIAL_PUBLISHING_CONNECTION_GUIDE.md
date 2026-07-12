# Devil n Dove Social Publishing Connection Guide

**Current version:** Build 210
**Purpose:** Connect Devil n Dove to Facebook, Instagram, Pinterest, and X for controlled social publishing, while preparing for future TikTok and YouTube integration.

---

## 1. Important distinction: tracking versus publishing

Social tracking and social publishing are different systems.

### Tracking tools

These measure website activity:

* Meta Pixel
* Pinterest Tag
* TikTok Pixel
* Google Analytics
* Google Ads conversion tags

They can record events such as:

* Product viewed
* Add to cart
* Checkout started
* Purchase completed
* Contact form submitted

A pixel **cannot create a Facebook or Instagram post**.

### Publishing integrations

Publishing requires:

* A developer account
* A developer application
* OAuth authorization or an authorized access token
* Permission to manage the social account
* The account or Page ID
* API permissions that allow content publishing
* Secure storage of credentials in Cloudflare

Devil n Dove Build 210 currently supports a review-first publishing queue. It can prepare social drafts automatically when products become eligible, but an administrator must still review and approve them before posting.

---

# Part 1 — Meta: Facebook and Instagram

## 2. What we need before creating the Meta app

We should have:

* A personal Facebook account that administers the business assets
* A Meta Business Portfolio
* A Devil n Dove Facebook Page
* An Instagram Professional account
* Administrator or full-control access to the Facebook Page
* Access to the Instagram account
* The Facebook Page and Instagram account added to the same Meta Business Portfolio

Instagram publishing through Meta requires a professional Instagram account—Business or Creator—not a personal Instagram account. Meta provides publishing APIs for professional accounts.

## 3. Open Meta Business Suite

Go to:

[Meta Business Suite](https://business.facebook.com/)

Sign in with the Facebook account that manages Devil n Dove.

### Confirm or create the Business Portfolio

1. Open **Settings** or **Business Settings**.
2. Look for the Devil n Dove Business Portfolio.
3. If one does not exist, choose **Create business portfolio**.
4. Enter:

   * Business name: `Devil n Dove`
   * Your name
   * Business email
5. Complete the email verification.

Meta sometimes changes the wording between “Business Account,” “Business Manager,” and “Business Portfolio.” They refer to the business-management area that owns or controls Pages, Instagram accounts, pixels, apps, and people.

## 4. Add the Devil n Dove Facebook Page

Inside Meta Business Settings:

1. Open **Accounts**.
2. Select **Pages**.
3. Choose **Add**.
4. Select **Add a Facebook Page**.
5. Search for or enter the Devil n Dove Page.
6. Confirm the request.

If the Page already belongs to the portfolio, it should appear in the list.

Confirm your Facebook profile has **Full control** or the equivalent administrator access.

## 5. Convert Instagram to a Professional account

On the Instagram mobile app:

1. Open the Devil n Dove profile.
2. Open the menu.
3. Select **Settings and activity**.
4. Find **Account type and tools**.
5. Choose **Switch to professional account**.
6. Select:

   * **Business** for a company/shop account, or
   * **Creator** for an artist/content-creator account.
7. Complete the requested category and contact settings.

For Devil n Dove, **Business** is likely the clearer choice because we sell products and operate a website.

## 6. Connect Instagram to the Facebook Page

The exact screen location may vary, but the goal is to connect the Devil n Dove Instagram professional account to the Devil n Dove Facebook Page.

Try this path in Instagram:

1. Open the Devil n Dove Instagram profile.
2. Select **Edit profile**.
3. Look for **Page**, **Connected Page**, or **Public business information**.
4. Select the Devil n Dove Facebook Page.
5. Complete the Facebook confirmation.

Also verify inside Meta Business Suite:

1. Open **Business Settings**.
2. Open **Accounts**.
3. Select **Instagram accounts**.
4. Choose **Add**.
5. Sign in to the Devil n Dove Instagram account.
6. Assign the Instagram account to the Devil n Dove Page and to your administrator profile.

The traditional Meta integration expects an Instagram Business or Creator account connected to a Facebook Page.

## 7. Create a Meta Developer account

Go to:

[Meta for Developers](https://developers.facebook.com/)

1. Sign in using the Facebook account that controls the Devil n Dove business assets.
2. Select **Get Started** if this is your first developer account.
3. Accept the Meta Platform Terms.
4. Verify your email or phone number if requested.
5. Complete developer registration.

## 8. Create the Devil n Dove Meta app

Open:

[Meta App Dashboard](https://developers.facebook.com/apps/)

Then:

1. Select **Create App**.
2. Meta may first ask for an app use case.
3. Choose the option most closely related to:

   * Managing business assets
   * Publishing content
   * Instagram
   * Facebook Login for Business
4. If asked for an app type, choose **Business**.
5. Enter:

   * **App name:** `Devil n Dove Social Publishing`
   * **App contact email:** the email we actively monitor
   * **Business Portfolio:** Devil n Dove
6. Select **Create App**.
7. Confirm your Facebook password if requested.

Meta’s official app-creation documentation is here:

[Create an App with Meta](https://developers.facebook.com/docs/development/create-an-app/)

## 9. Record the Meta App ID and App Secret

Inside the new app:

1. Open **App settings**.
2. Select **Basic**.
3. Record the **App ID**.
4. Locate **App Secret**.
5. Select **Show**.
6. Confirm your Facebook password if requested.
7. Store the secret in a password manager.

Do not paste the App Secret into browser JavaScript, HTML, Markdown, GitHub, or a public support message.

Eventually, the application should use these Cloudflare secrets:

```text
META_APP_ID
META_APP_SECRET
```

Build 210 does not yet require these for its manual-token connection, but they will be required when we add the complete Meta OAuth connection button and automatic token renewal.

## 10. Add the Meta products/use cases

Meta’s dashboard changes regularly. Depending on the interface, look for **Add product**, **Customize use case**, or **Set up**.

Enable the components related to:

* Facebook Login for Business
* Facebook Pages API
* Instagram API
* Instagram content publishing

Official references:

* [Facebook Pages API](https://developers.facebook.com/docs/pages-api/)
* [Facebook Page post publishing](https://developers.facebook.com/docs/pages-api/posts/)
* [Instagram Platform](https://developers.facebook.com/docs/instagram-platform/)
* [Instagram content publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing/)

The Pages API can create and manage Page posts. Instagram’s publishing API supports image, video, Reel, and carousel publishing for eligible professional accounts.

## 11. Configure the app’s basic information

In **App settings → Basic**, complete as many of these as Meta requests:

* App icon
* Display name
* Contact email
* Privacy policy URL
* Terms of service URL
* User data deletion instructions or callback URL
* App domains
* Business verification details
* Category

Suggested values:

```text
App domain:
devilndove.com
```

Suggested legal URLs should point to real public pages on the website, for example:

```text
https://devilndove.com/privacy/
https://devilndove.com/terms/
https://devilndove.com/data-deletion/
```

Do not invent these URLs unless those pages actually exist. Create and publish the pages before entering them in Meta.

## 12. Add app roles for testing

While the Meta app is in Development mode, only people assigned to the app can normally test it.

Inside the Meta app:

1. Open **App roles** or **Roles**.
2. Add your Facebook profile as an:

   * Administrator
   * Developer
   * Tester
3. Accept any invitation from the receiving account.

Make sure the same profile also has management access to the Devil n Dove Facebook Page and Instagram account.

## 13. Request the Facebook permissions

For posting to a Facebook Page, the app will commonly need permissions in this family:

```text
pages_show_list
pages_read_engagement
pages_manage_posts
```

Depending on the exact features implemented, Meta may also require:

```text
business_management
```

Do not request unrelated permissions. Meta expects each requested permission to be tied to a real, demonstrated function.

Use the official permissions reference to check the current requirements:

[Meta Permissions Reference](https://developers.facebook.com/docs/permissions/)

## 14. Request the Instagram permissions

The exact permission names depend on whether we use Instagram Login or the Facebook-linked Instagram approach.

The current Devil n Dove implementation is designed around these traditional Instagram Graph API permissions:

```text
instagram_basic
instagram_content_publish
pages_show_list
pages_read_engagement
```

Meta also offers Instagram API with Instagram Login for professional accounts. That newer approach can reduce the dependency on Facebook Login for some Instagram-only integrations, but because Devil n Dove also needs Facebook Page publishing, one Meta app that can access both business assets remains practical.

## 15. Generate a temporary user access token for testing

Open:

[Meta Graph API Explorer](https://developers.facebook.com/tools/explorer/)

Then:

1. Choose the Devil n Dove Meta app from the application dropdown.
2. Select **Get Token**.
3. Choose **Get User Access Token**.
4. Select the permissions required for Facebook and Instagram testing.
5. Sign in and approve access.
6. Copy the generated user token.
7. Use it only for testing.

A user token is not necessarily the final Page token needed by the application.

## 16. Get the Facebook Page ID and Page access token

With an authorized user token, the application can request Pages that the user manages.

In Graph API Explorer, try:

```text
GET /me/accounts
```

The result should include the Devil n Dove Page and values such as:

```json
{
  "name": "Devil n Dove",
  "id": "FACEBOOK_PAGE_ID",
  "access_token": "FACEBOOK_PAGE_ACCESS_TOKEN"
}
```

Save:

```text
FACEBOOK_PAGE_ID
FACEBOOK_PAGE_ACCESS_TOKEN
```

Meta explains that Page access tokens are used to read, write, and modify Page-owned data. A Page token is obtained from an authorized user token.

## 17. Get the Instagram professional account ID

Using the Facebook Page ID and an appropriate token, query:

```text
GET /FACEBOOK_PAGE_ID?fields=instagram_business_account
```

The response should contain something similar to:

```json
{
  "instagram_business_account": {
    "id": "INSTAGRAM_USER_ID"
  },
  "id": "FACEBOOK_PAGE_ID"
}
```

Save the Instagram ID as:

```text
INSTAGRAM_USER_ID
```

For the current Devil n Dove implementation, the Page token may also be used for linked Instagram Graph API operations. The project currently expects a separate secret named:

```text
INSTAGRAM_ACCESS_TOKEN
```

For initial testing, this can contain the authorized token that successfully performs the Instagram calls. Later, the application should use a proper OAuth-managed connection and refresh process rather than relying on manually copied tokens.

## 18. Exchange the Meta token for a longer-lived token

Temporary tokens expire quickly. Meta documents exchanging a short-lived user token for a long-lived user token and then obtaining a long-lived Page token.

Official instructions:

[Meta long-lived access tokens](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens/get-long-lived)

This process normally requires:

```text
META_APP_ID
META_APP_SECRET
SHORT_LIVED_USER_ACCESS_TOKEN
```

Do not perform the token exchange through a public browser URL where the App Secret could appear in browser history. Use a secure server-side tool, Meta’s approved tools, or the future Devil n Dove OAuth callback.

## 19. Add the Meta values to Cloudflare

Open:

[Cloudflare Dashboard](https://dash.cloudflare.com/)

Then:

1. Open **Workers & Pages**.
2. Select the Devil n Dove Pages project.
3. Open **Settings**.
4. Find **Variables and Secrets**.
5. Add the following as encrypted secrets:

```text
FACEBOOK_PAGE_ID
FACEBOOK_PAGE_ACCESS_TOKEN
INSTAGRAM_USER_ID
INSTAGRAM_ACCESS_TOKEN
META_GRAPH_API_VERSION
```

Recommended value:

```text
META_GRAPH_API_VERSION=v25.0
```

Also store these for the future OAuth connection:

```text
META_APP_ID
META_APP_SECRET
```

After saving variables, create a new production deployment so the Pages Functions receive the updated environment.

## 20. Test Facebook safely

In Devil n Dove:

1. Open:

   ```text
   /admin/social-publishing/
   ```

2. Confirm Facebook shows as configured.

3. Create a test social draft.

4. Select Facebook only.

5. Use **Dry run**.

6. Review the exact caption, image, and product URL.

7. Publish one low-risk test.

8. Confirm the post appears on the Devil n Dove Page.

9. Confirm no token or internal error information appears publicly.

## 21. Test Instagram safely

Before testing, make sure the selected image is:

* Publicly accessible over HTTPS
* Not behind admin authentication
* Not a placeholder
* Correctly oriented
* Cleared for public use
* Free of private customer information
* Within Instagram’s current media requirements

Then:

1. Create a separate social draft.
2. Select Instagram only.
3. Use **Dry run**.
4. Confirm the professional-account ID.
5. Publish one image post.
6. Confirm the post appears on the correct Instagram account.
7. Check the caption, crop, hashtags, and product link text.

Instagram publishing generally uses a two-step process: create a media container and then publish that container.

## 22. Move the Meta app from Development to Live

For an app used only by people assigned as app administrators or testers, Development mode may be enough for initial testing.

For broader or production authorization, Meta may require:

* Business verification
* Privacy policy
* Terms
* Data deletion instructions
* App review
* Advanced Access for requested permissions
* A screen recording demonstrating each permission
* Test credentials or reviewer instructions

Inside the Meta app:

1. Open **App Review**.
2. Open **Permissions and Features**.
3. Request Advanced Access only for the permissions we actually use.
4. Explain:

   * The app creates draft social posts from Devil n Dove products.
   * An administrator reviews content.
   * The app publishes only to Devil n Dove-owned accounts.
   * It does not publish customer material without authorization.
5. Record a demonstration video showing:

   * Admin login
   * Product selection
   * Social draft generation
   * Human review
   * Facebook or Instagram publishing
   * Result on the connected account
6. Submit the app for review.
7. Complete business verification if requested.
8. Switch the app to **Live** only after the connection is tested.

---

# Part 2 — Pinterest

## 23. Pinterest prerequisites

We need:

* A Pinterest Business account
* A Devil n Dove Pinterest profile
* At least one board for products
* A Pinterest developer account
* A Pinterest application
* OAuth authorization for the Devil n Dove account

Pinterest requires a Business account to start developing.

## 24. Create or convert to a Pinterest Business account

Go to:

[Pinterest Business](https://business.pinterest.com/)

Sign in or create a business account for Devil n Dove.

Create at least one board, such as:

```text
Devil n Dove Handmade Products
```

## 25. Create a Pinterest developer account

Open:

[Pinterest Developers](https://developers.pinterest.com/)

1. Select **Get started** or **My Apps**.
2. Sign in using the Devil n Dove Pinterest Business account.
3. Accept the developer terms.
4. Complete any requested business information.

## 26. Create the Pinterest app

Open:

[Pinterest Apps](https://developers.pinterest.com/apps/)

1. Select **Create app**.
2. Enter an app name such as:

   ```text
   Devil n Dove Social Publishing
   ```
3. Enter the requested description and contact details.
4. Associate it with the Devil n Dove business account.
5. Save the app.
6. Record:

   ```text
   PINTEREST_APP_ID
   PINTEREST_APP_SECRET
   ```

Pinterest’s official connection guide explains registering the app, configuring redirect URIs, and implementing OAuth.

## 27. Add the Pinterest redirect URI

The complete production integration should eventually use:

```text
https://devilndove.com/api/social/oauth/pinterest/callback
```

However, only register this after that callback route exists in the Devil n Dove application.

Pinterest requires the redirect URI in the OAuth request to match a registered URI.

## 28. Request the Pinterest scopes

For creating Pins, the eventual OAuth request should include only the needed scopes, normally from this group:

```text
boards:read
pins:read
pins:write
user_accounts:read
```

Check the current Pinterest scope names in the official API documentation before implementing OAuth:

[Pinterest API v5](https://developers.pinterest.com/docs/api/v5/)

## 29. Generate a Pinterest test token

Pinterest offers development and testing tools. Depending on the current access tier:

1. Open the app in **My Apps**.
2. Select **Manage**.
3. Open **Configure**.
4. Find **Generate Access Token**.
5. Select the Sandbox or Trial environment if available.
6. Generate a token for the Devil n Dove account.
7. Store it securely.

Pinterest notes that sandbox tokens may be temporary; one documented sandbox-token period is 30 days.

Pinterest also provides OAuth/Postman tools for generating and testing access tokens.

## 30. Find the Pinterest Board ID

Use Pinterest’s API tools or Postman collection to list boards for the authorized account.

Select the board intended for Devil n Dove product posts and record:

```text
PINTEREST_BOARD_ID
```

## 31. Add Pinterest secrets to Cloudflare

Add:

```text
PINTEREST_ACCESS_TOKEN
PINTEREST_BOARD_ID
```

For the future complete OAuth flow also add:

```text
PINTEREST_APP_ID
PINTEREST_APP_SECRET
```

Redeploy after saving the secrets.

## 32. Test Pinterest

1. Open `/admin/social-publishing/`.
2. Select Pinterest only.
3. Use a vertical or Pinterest-friendly real product image.
4. Include:

   * Product title
   * Useful description
   * Public product URL
   * Relevant board
5. Run Dry Run.
6. Publish one test Pin.
7. Confirm the image, title, description, board, and destination link.

Pinterest’s Create Pin endpoint can create a Pin on a board owned by the authorized account.

## 33. Request Pinterest production access

A test or trial app may need an access-tier upgrade before full production use.

Pinterest expects a compliant OAuth authorization flow rather than collected login credentials or session cookies.

Prepare:

* Privacy policy
* Terms of service
* OAuth connection screen
* Demonstration video
* Description of product-to-Pin workflow
* Explanation of human review
* Screenshots showing the published result
* Explanation of how users disconnect or revoke access

---

# Part 3 — X

## 34. Understand X access first

X API access and pricing can change. Review the current plans before building around it:

[X Developer Platform](https://docs.x.com/overview)

A read-only Bearer Token cannot publish posts. Publishing requires authorization on behalf of the X user with write permission.

## 35. Create an X developer account

Go to:

[X Developer Console](https://developer.x.com/)

1. Sign in using the Devil n Dove X account or the account that will own the developer application.
2. Apply for developer/API access if prompted.
3. Describe the use case accurately:

   * Creating reviewed product and workshop posts
   * Publishing only to the Devil n Dove account
   * No bulk spam
   * No automated replies
   * No scraping
4. Accept the terms.
5. Select an access plan that supports posting.

X’s official getting-access guide describes creating the developer account, app, and credentials.

## 36. Create the X project and app

Inside the Developer Console:

1. Create a project if required.
2. Create an app named:

   ```text
   Devil n Dove Social Publishing
   ```
3. Enter a description.
4. Record the generated credentials securely.

The app may provide:

```text
X_API_KEY
X_API_KEY_SECRET
X_BEARER_TOKEN
X_CLIENT_ID
X_CLIENT_SECRET
```

The App-only Bearer Token is useful for some read operations, but it is not enough for posting.

## 37. Configure X user authentication

Open the app’s **Settings** or **User authentication settings**.

Recommended configuration:

```text
OAuth 2.0
Application type: Web App
```

Add the callback URL only after the corresponding Devil n Dove route exists:

```text
https://devilndove.com/api/social/oauth/x/callback
```

Add the website URL:

```text
https://devilndove.com/
```

Request scopes:

```text
tweet.read
tweet.write
users.read
offline.access
```

The `offline.access` scope is needed when the app must receive a refresh token and continue operating after the initial access token expires.

X documents OAuth 2.0 Authorization Code with PKCE and configuring OAuth in the app’s authentication settings.

## 38. Generate or authorize the X user token

For the current Build 210 implementation, the required value is:

```text
X_USER_ACCESS_TOKEN
```

It must be a token representing the Devil n Dove X user with permission to publish.

Do not substitute:

```text
X_BEARER_TOKEN
```

An app-only Bearer Token is generally read-only and cannot publish as the account.

If we change permissions after creating a token, reauthorize the account and obtain a new token because existing tokens may not inherit the updated permissions.

## 39. Add X credentials to Cloudflare

For the current implementation:

```text
X_USER_ACCESS_TOKEN
```

For the future OAuth/refresh implementation:

```text
X_CLIENT_ID
X_CLIENT_SECRET
X_API_KEY
X_API_KEY_SECRET
```

Never expose these in browser code.

## 40. Test X

1. Open `/admin/social-publishing/`.
2. Select X only.
3. Keep the caption within the current post-length rules.
4. Use a short product URL with UTM parameters.
5. Run Dry Run.
6. Publish one test.
7. Confirm it appears on the correct X account.

The current create-post endpoint is:

```text
POST /2/tweets
```

X documents that endpoint for creating posts for the authenticated user.

---

# Part 4 — TikTok

## 41. Current Devil n Dove status

Build 210 does **not yet implement complete TikTok publishing**.

It can prepare TikTok-oriented drafts, captions, and media choices, but TikTok should remain marked:

```text
Prepared / Manual
```

until we build:

* TikTok OAuth
* Creator/account information checks
* Direct Post or Upload flow
* Media transfer
* Status polling or webhooks
* Token refresh
* TikTok app audit requirements

## 42. Create a TikTok developer account

Go to:

[TikTok for Developers](https://developers.tiktok.com/)

1. Sign in with the Devil n Dove TikTok account or a designated developer account.
2. Complete developer registration.
3. Verify the email and requested account details.

## 43. Create the TikTok app

1. Open **Manage apps**.
2. Select **Connect an app** or **Create app**.
3. Enter:

   ```text
   Devil n Dove Social Publishing
   ```
4. Enter the website:

   ```text
   https://devilndove.com/
   ```
5. Add the requested privacy-policy and terms URLs.
6. Add an app icon.
7. Save the app.

Record:

```text
TIKTOK_CLIENT_KEY
TIKTOK_CLIENT_SECRET
```

## 44. Add TikTok products

Inside the TikTok app, add:

* Login Kit
* Content Posting API

TikTok’s Content Posting API supports either Direct Post or an upload flow where the user completes the post in TikTok.

## 45. Decide between Direct Post and Upload

### Direct Post

The application publishes directly after the authorized user reviews the required settings.

Likely scope:

```text
video.publish
```

### Upload only

The application uploads media, and the user finishes the post inside TikTok.

Likely scope:

```text
video.upload
```

For Devil n Dove, the **upload-only workflow may be the safer first implementation**, because it preserves a final TikTok-side review before publishing.

## 46. Add the TikTok redirect URI

After the application callback exists, register:

```text
https://devilndove.com/api/social/oauth/tiktok/callback
```

The domain or media URL prefix may also need verification when TikTok pulls media from a hosted URL. TikTok’s upload guide notes that photo URLs may need to come from a verified domain or URL prefix.

## 47. Request TikTok scopes and submit for review

The requested capabilities may include:

```text
user.info.basic
video.upload
video.publish
```

Request only the scopes needed by the selected workflow.

TikTok app review may require:

* Demo video
* Privacy policy
* Terms of service
* Content-publishing user interface
* User consent flow
* Post-status handling
* Domain verification
* Explanation of how users control captions, privacy, comments, and disclosure settings

TikTok says unaudited Direct Post clients can be restricted to private visibility until the client passes audit.

## 48. Future TikTok Cloudflare secrets

Do not add a temporary manually copied token as the permanent solution.

The completed integration should use:

```text
TIKTOK_CLIENT_KEY
TIKTOK_CLIENT_SECRET
TIKTOK_ACCESS_TOKEN
TIKTOK_REFRESH_TOKEN
```

The application will also need expiry tracking and token refresh.

---

# Part 5 — YouTube

## 49. Current Devil n Dove status

Build 210 does **not yet perform full YouTube uploads**.

It can prepare:

* Video title
* Description
* Product links
* Thumbnail plan
* Tags
* Shorts caption
* Publishing package

The future integration requires Google OAuth and resumable uploads.

## 50. Open Google Cloud Console

Go to:

[Google Cloud Console](https://console.cloud.google.com/)

Sign in using the Google account that owns or manages the Devil n Dove YouTube channel.

## 51. Create a Google Cloud project

1. Open the project selector.
2. Choose **New Project**.
3. Name it:

   ```text
   Devil n Dove Social Publishing
   ```
4. Associate the correct organization if one exists.
5. Select **Create**.
6. Make sure this project is selected before continuing.

## 52. Enable YouTube Data API v3

Open:

[Google API Library](https://console.cloud.google.com/apis/library)

1. Search for:

   ```text
   YouTube Data API v3
   ```
2. Open it.
3. Select **Enable**.

Google requires the API to be enabled for the selected Cloud project before the application can call it.

## 53. Configure the Google OAuth consent screen

Inside Google Cloud Console:

1. Open **Google Auth Platform** or **OAuth consent screen**.
2. Select the appropriate audience:

   * **External** for a normal Google/YouTube account
   * **Internal** only when using a qualifying Google Workspace organization
3. Enter:

   * App name: `Devil n Dove Social Publishing`
   * Support email
   * Developer contact email
   * App logo
   * Website URL
   * Privacy policy URL
   * Terms URL
4. Save.

While the app is in Testing mode, add the Google account that owns the Devil n Dove YouTube channel as a test user.

## 54. Add the YouTube upload scope

For upload-only functionality, request:

```text
https://www.googleapis.com/auth/youtube.upload
```

Broader scopes such as `youtube` or `youtube.force-ssl` give more control than an upload-only integration may need. Start with the narrowest practical scope.

The `videos.insert` endpoint accepts several YouTube authorization scopes, including `youtube.upload`.

## 55. Create the OAuth client

Open:

[Google API Credentials](https://console.cloud.google.com/apis/credentials)

Then:

1. Select **Create Credentials**.
2. Choose **OAuth client ID**.
3. Select:

   ```text
   Web application
   ```
4. Name it:

   ```text
   Devil n Dove Web OAuth
   ```
5. Add this redirect URI after the Devil n Dove callback exists:

   ```text
   https://devilndove.com/api/social/oauth/youtube/callback
   ```
6. Select **Create**.
7. Securely save:

   ```text
   YOUTUBE_CLIENT_ID
   YOUTUBE_CLIENT_SECRET
   ```

Google requires the redirect URI in the authorization request to exactly match an authorized redirect URI.

## 56. Implement offline OAuth access

The application should request:

```text
access_type=offline
prompt=consent
```

This allows Google to issue a refresh token so Devil n Dove can obtain replacement access tokens without asking us to reconnect every hour.

The completed integration should securely store:

```text
YOUTUBE_ACCESS_TOKEN
YOUTUBE_REFRESH_TOKEN
YOUTUBE_TOKEN_EXPIRES_AT
```

Google recommends using a tested OAuth library for server-side applications and securely storing the client secret and refresh token.

## 57. Build the upload workflow

The future upload route should:

1. Confirm an administrator approved the social/video package.
2. Confirm media rights and privacy review.
3. Refresh the access token when necessary.
4. Start a resumable upload.
5. Upload the video.
6. Set:

   * Title
   * Description
   * Tags
   * Privacy status
   * Category
   * Made-for-kids status
   * Subscriber-notification choice
7. Store the returned YouTube video ID.
8. Poll processing status.
9. Add the approved thumbnail if available.
10. Record the publication result in the Devil n Dove queue.

YouTube uploads use the `videos.insert` endpoint.

## 58. Understand YouTube audit restrictions

Google states that uploads from unverified API projects created after July 28, 2020 can be restricted to private viewing until the project completes an audit.

Therefore, our first implementation should deliberately default to:

```text
privacyStatus=private
notifySubscribers=false
```

until the upload and compliance process is verified.

## 59. Future YouTube Cloudflare secrets

```text
YOUTUBE_CLIENT_ID
YOUTUBE_CLIENT_SECRET
YOUTUBE_ACCESS_TOKEN
YOUTUBE_REFRESH_TOKEN
```

Do not use a service account for an ordinary Devil n Dove YouTube channel. YouTube service-account support is generally limited to qualifying content owners managing multiple channels.

---

# Part 6 — Cloudflare secret checklist

## 60. Current Build 210 secrets

### Facebook

```text
FACEBOOK_PAGE_ID
FACEBOOK_PAGE_ACCESS_TOKEN
META_GRAPH_API_VERSION
```

### Instagram

```text
INSTAGRAM_USER_ID
INSTAGRAM_ACCESS_TOKEN
```

### Pinterest

```text
PINTEREST_ACCESS_TOKEN
PINTEREST_BOARD_ID
```

### X

```text
X_USER_ACCESS_TOKEN
```

## 61. Future OAuth secrets

### Meta

```text
META_APP_ID
META_APP_SECRET
```

### Pinterest

```text
PINTEREST_APP_ID
PINTEREST_APP_SECRET
```

### X

```text
X_CLIENT_ID
X_CLIENT_SECRET
X_API_KEY
X_API_KEY_SECRET
```

### TikTok

```text
TIKTOK_CLIENT_KEY
TIKTOK_CLIENT_SECRET
TIKTOK_ACCESS_TOKEN
TIKTOK_REFRESH_TOKEN
```

### YouTube

```text
YOUTUBE_CLIENT_ID
YOUTUBE_CLIENT_SECRET
YOUTUBE_ACCESS_TOKEN
YOUTUBE_REFRESH_TOKEN
```

---

# Part 7 — Recommended setup order

Complete the integrations in this order:

1. Confirm the Devil n Dove Facebook Page and Instagram Professional account are connected in Meta Business Suite.
2. Create the Meta developer app.
3. Configure Facebook Page permissions.
4. Configure Instagram publishing permissions.
5. Generate test Page and Instagram tokens.
6. Test Facebook with one draft.
7. Test Instagram with one draft.
8. Complete Meta business verification and App Review if required.
9. Create the Pinterest developer app and test one Pin.
10. Review X API pricing and create the X app only if the cost is justified.
11. Build TikTok OAuth and upload-only workflow.
12. Build YouTube OAuth and private resumable-upload workflow.

---

# Part 8 — Security rules

Never:

* Put access tokens in HTML or browser JavaScript.
* Commit tokens to GitHub.
* Paste complete tokens into chat messages or screenshots.
* Store tokens in Markdown documents.
* Use a personal social password as an API credential.
* Publish media that has not passed rights and privacy review.
* Automatically publish a newly created product without an approval stage.
* Use customer photos, names, addresses, receipts, children, licence plates, or private workshop paperwork without explicit permission.

Always:

* Store secrets in Cloudflare encrypted variables.
* Use OAuth where supported.
* Request only the permissions the application needs.
* Record token expiry dates.
* Use refresh tokens rather than manually replacing access tokens indefinitely.
* Provide a disconnect/revoke function.
* Record publish attempts and returned platform post IDs.
* Keep Dry Run and manual approval enabled during setup.
* Rotate credentials immediately if they may have been exposed.

---

# Part 9 — What still needs to be developed in Devil n Dove

Build 210 begins the product-to-social draft workflow, but a complete integration should add:

1. **Connect Facebook/Instagram** OAuth button.
2. Meta OAuth callback route.
3. Automatic Page and Instagram account discovery.
4. Encrypted token storage with expiry dates.
5. Token refresh and connection-health checks.
6. Pinterest OAuth button and callback.
7. X OAuth 2.0 PKCE flow and refresh handling.
8. TikTok OAuth plus upload-only workflow.
9. YouTube OAuth plus resumable private upload.
10. Disconnect/revoke controls for every provider.
11. Connection test buttons.
12. Per-platform publish history.
13. Retry logic for temporary API failures.
14. Rate-limit handling.
15. Webhook or polling support where platforms require asynchronous processing.
16. A platform-specific preview before approval.
17. A clear separation among:

    * Draft created
    * Content reviewed
    * Privacy approved
    * Platform approved
    * Scheduled
    * Publishing
    * Published
    * Failed
18. Automatic token-expiry warnings.
19. Administrator notifications when a platform disconnects.
20. A complete social analytics dashboard using stored post IDs and UTM results.

Until those OAuth features are built, manually entered access tokens should be treated as controlled testing credentials—not the final permanent social connection.


---

## Build 211: work while credentials are pending

Use `/admin/social-publishing/#social-platform-preflight` before API credentials are approved. It validates proposed captions, public links, and product image accessibility without calling a social network or saving data. It is not a substitute for account authorization, app review, privacy review, or media consent.


# Build 212 — Social platform policy and callback prerequisites

The following production prerequisites now exist directly in the application:

- `https://devilndove.com/privacy/` and `/privacy.html`
- `https://devilndove.com/terms/` and `/terms.html`
- `https://devilndove.com/data-deletion/` and `/data-deletion.html`
- `https://devilndove.com/social-connections/` and `/social-connections.html`
- Exact OAuth callback routes for Meta/Facebook/Instagram, Pinterest, X, TikTok, and YouTube
- `https://devilndove.com/api/social/meta/data-deletion`
- `https://devilndove.com/api/social/integration-readiness`

The Pinterest verification meta tag is present in every HTML head. Callback routes are currently safe readiness endpoints: they do not exchange codes or store tokens until one-time state storage, encrypted token persistence, refresh, and disconnect controls are implemented.
