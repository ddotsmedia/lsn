# Phase 1 Testing Checklist - Little Smarties Admin Dashboard

**Test Date**: _______________  
**Tester**: _______________  
**VPS IP**: 187.127.185.239  
**Frontend URL**: http://187.127.185.239:3000  
**Admin URL**: http://187.127.185.239:3000/admin/login

---

## 🔐 AUTHENTICATION TESTING

### Login Page
- [ ] Login page loads without errors at `/admin/login`
- [ ] Page displays "Little Smarties" branding
- [ ] Username field is present and editable
- [ ] Password field is present and editable
- [ ] "Login" button is visible and clickable
- [ ] Enter valid credentials:
  - Username: `admin`
  - Password: `AdminSecret123!`
- [ ] Login successful - redirects to `/admin/text-editor`
- [ ] Token is stored in localStorage as `lsn_token`
- [ ] Invalid credentials show error message

### Logout Functionality
- [ ] Logout button visible in admin header
- [ ] Clicking logout clears token from localStorage
- [ ] Redirects to login page after logout
- [ ] Cannot access admin pages after logout without re-login

---

## 🎨 UI/UX DESIGN TESTING

### Header Design
- [ ] Header is sticky (stays at top on scroll)
- [ ] "Little Smarties" logo has gradient effect
- [ ] "Admin Dashboard" subtitle visible on desktop (hidden on mobile)
- [ ] Dark mode toggle button (moon/sun icon) present
- [ ] Logout button clearly visible
- [ ] Header padding and spacing look correct

### Sidebar Navigation (Desktop)
- [ ] Sidebar is visible on desktop (≥1024px width)
- [ ] Sidebar shows "PAGES" section header
- [ ] All pages listed: Home, About, Facilities, Contact, Services
- [ ] Current page is highlighted with blue background
- [ ] Clicking page name changes selection
- [ ] Sidebar is scrollable if content exceeds viewport

### Sidebar Navigation (Mobile)
- [ ] On mobile (<1024px), hamburger menu icon visible
- [ ] Clicking hamburger opens sidebar overlay
- [ ] Clicking hamburger again closes sidebar
- [ ] Clicking outside sidebar closes it
- [ ] Sidebar has dark background (#1f1f1f or similar)
- [ ] Page links are white text on dark background

### Main Content Area
- [ ] Max-width container properly centered
- [ ] Padding/margins appropriate on all screen sizes
- [ ] Background color is light gray on light mode
- [ ] Background color is dark gray on dark mode

---

## 🌙 DARK MODE TESTING

### Dark Mode Toggle
- [ ] Moon icon shows in light mode
- [ ] Sun icon shows in dark mode
- [ ] Clicking icon toggles between light/dark
- [ ] Preference persists after page refresh
- [ ] Persists across different admin pages

### Light Mode Colors
- [ ] Background: Light gray/white
- [ ] Text: Dark gray/black
- [ ] Cards: White with subtle shadows
- [ ] Buttons: Blue primary color
- [ ] Borders: Light gray
- [ ] All text is readable (sufficient contrast)

### Dark Mode Colors
- [ ] Background: Very dark gray (#0a0a0a or similar)
- [ ] Text: White/light gray
- [ ] Cards: Dark gray (#1a1a1a or similar)
- [ ] Buttons: Blue primary color
- [ ] Borders: Dark gray with subtle difference
- [ ] All text is readable (sufficient contrast)

### Dark Mode Persistence
- [ ] Toggle dark mode on
- [ ] Refresh page - dark mode persists
- [ ] Navigate to different page - dark mode persists
- [ ] Close and reopen browser - dark mode persists
- [ ] Switch to light mode
- [ ] All persistence tests above repeat with light mode

---

## 📝 TEXT EDITOR PAGE TESTING

### Page Load
- [ ] Page loads at `/admin/text-editor`
- [ ] No console errors in browser dev tools
- [ ] All sections load within 2 seconds
- [ ] Page title shows "Content Editor"

### Page Selection
- [ ] Sidebar shows all 5 pages
- [ ] Clicking page changes content area
- [ ] Previous page is no longer highlighted
- [ ] New page content displays correctly
- [ ] Page title in content area updates
- [ ] Page description displays below title

### Section Display (View Mode)
- [ ] Section cards display with rounded corners
- [ ] Each section shows:
  - [ ] Section title (bold, large text)
  - [ ] Section content (readable text)
  - [ ] Section image (if available)
  - [ ] "Edit Section" button
- [ ] Card styling consistent across all sections
- [ ] Card shadows visible (subtle on light, medium on dark)

### Edit Mode
- [ ] Click "Edit Section" button
- [ ] Card transforms to edit mode
- [ ] "Section Title" input field appears
- [ ] "Content" textarea appears (6 rows)
- [ ] Image upload area appears with:
  - [ ] Current image preview (if exists)
  - [ ] Dashed border upload area
  - [ ] Upload icon
  - [ ] "Click to upload image" text
- [ ] "Save Changes" button appears (blue)
- [ ] "Cancel" button appears (outline style)

### Text Editing
- [ ] Type in section title field - text updates
- [ ] Type in content textarea - text updates
- [ ] Can undo typing (Ctrl+Z)
- [ ] Text is preserved when switching between sections
- [ ] Text characters display correctly (special chars, emojis)

### Image Upload
- [ ] Click upload area to open file picker
- [ ] Select an image file
- [ ] File picker closes
- [ ] "Uploading..." message appears
- [ ] After upload, image preview displays
- [ ] Image dimensions look correct
- [ ] Image has rounded corners

### Save Functionality
- [ ] Click "Save Changes" button
- [ ] "Saving..." text appears with spinner
- [ ] After save, spinner disappears
- [ ] Success notification appears (green banner)
- [ ] Section switches back to view mode
- [ ] Saved content displays correctly
- [ ] Other sections still show previous data

### Cancel Editing
- [ ] Click "Cancel" button
- [ ] Edit mode closes without saving
- [ ] Section returns to view mode
- [ ] Original content is preserved (changes discarded)

### Error Handling
- [ ] Try saving with empty title - error message appears
- [ ] Try uploading non-image file - error message shown
- [ ] Try uploading very large file - error message shown
- [ ] Error messages are clear and readable
- [ ] Error messages have red background (light mode)
- [ ] Error messages have dark red background (dark mode)

---

## 📱 RESPONSIVE DESIGN TESTING

### Desktop (1920x1080)
- [ ] All content visible without scrolling (vertically)
- [ ] Sidebar is visible (not hamburger menu)
- [ ] 4-column layout for page selection
- [ ] Main content takes full remaining width
- [ ] No text truncation
- [ ] Images scale properly

### Tablet (768x1024)
- [ ] Sidebar toggles with hamburger menu
- [ ] Content reflows to smaller width
- [ ] Touch targets (buttons) are at least 44px
- [ ] Text is readable
- [ ] Image previews are not too large
- [ ] Form fields are easy to interact with

### Mobile (375x667)
- [ ] Hamburger menu visible
- [ ] Content is single column
- [ ] All elements fit within screen width
- [ ] No horizontal scrolling
- [ ] Text is readable
- [ ] Buttons are large enough to tap
- [ ] Form inputs are easy to use
- [ ] Images are visible (not cut off)

### Orientation Changes
- [ ] Content adjusts when rotating device
- [ ] No content is lost on rotation
- [ ] Layout is appropriate for new orientation
- [ ] Text remains readable after rotation

---

## ⚡ PERFORMANCE TESTING

### Page Load Speed
- [ ] Home page loads in < 2 seconds
- [ ] Admin login page loads in < 2 seconds
- [ ] Text editor page loads in < 3 seconds
- [ ] Subsequent page navigation is fast (< 1 second)

### Resource Usage
- [ ] Browser memory usage < 150MB
- [ ] No memory leaks after extended use
- [ ] CPU usage is low during idle
- [ ] Smooth scrolling (60 FPS)

### Network Performance
- [ ] API requests complete in < 500ms
- [ ] Large images load progressively
- [ ] No failed network requests
- [ ] Offline functionality works (if applicable)

### Button Response
- [ ] Buttons respond immediately to click
- [ ] Loading states show quickly
- [ ] Animations are smooth (not janky)
- [ ] No double-submission on double-click

---

## 🔗 API INTEGRATION TESTING

### Backend Connectivity
- [ ] Backend endpoint reachable at http://localhost:3001
- [ ] Health check passes: `GET /api/v1/health`
- [ ] Pages endpoint working: `GET /api/v1/pages`
- [ ] Auth endpoint working: `POST /api/v1/auth/login`

### Authentication API
- [ ] Login with valid credentials returns JWT token
- [ ] Invalid credentials return error
- [ ] Token is valid JWT format (jwt.io verification)
- [ ] Token works in Authorization header: `Bearer <token>`

### Pages API
- [ ] `GET /api/v1/pages` returns all pages
- [ ] `GET /api/v1/pages/{slug}` returns specific page
- [ ] Response includes page_sections array
- [ ] Page data has required fields: id, slug, title, description

### Sections API
- [ ] `PUT /api/v1/pages/{slug}/sections/{key}` updates section
- [ ] Update is reflected immediately in UI
- [ ] Update is persisted to database
- [ ] Image uploads are stored correctly
- [ ] Responses include updated section data

### CORS Testing
- [ ] Requests from http://187.127.185.239:3000 succeed
- [ ] CORS headers are present in responses
- [ ] No CORS errors in browser console

---

## 📊 DATA INTEGRITY TESTING

### Database Verification
- [ ] All 5 pages exist in database
- [ ] Pages have correct slugs (home, about, facilities, contact, services)
- [ ] Page sections are linked to correct pages
- [ ] No orphaned sections exist
- [ ] Database backups are present

### Data Persistence
- [ ] Edit a section and save
- [ ] Refresh page - changes are still there
- [ ] Log out and log back in - changes persist
- [ ] Restart backend - changes persist
- [ ] Stop and restart database - changes persist

### Data Validation
- [ ] Very long text (>5000 chars) is handled correctly
- [ ] Special characters (é, ñ, 中文) are stored and displayed
- [ ] HTML/script tags are safely handled
- [ ] Empty fields are handled gracefully
- [ ] Null values don't cause errors

---

## 🎯 ACCESSIBILITY TESTING

### Keyboard Navigation
- [ ] Tab key moves between interactive elements
- [ ] Focus indicators are visible (blue outline)
- [ ] Enter/Space activates buttons
- [ ] Escape key closes dialogs/menus
- [ ] All functionality accessible without mouse

### Screen Reader (NVDA/JAWS)
- [ ] Buttons have descriptive labels
- [ ] Form inputs have associated labels
- [ ] Links have descriptive text
- [ ] Images have alt text
- [ ] Page structure is logical (headings, landmarks)

### Color Contrast
- [ ] Text on buttons has sufficient contrast
- [ ] Text on backgrounds meets WCAG AA standard
- [ ] Form labels are readable
- [ ] Icons have proper contrast with background

### Focus Management
- [ ] Focus moves logically through form
- [ ] Focus visible on all interactive elements
- [ ] Focus trapped in modals (if applicable)
- [ ] Focus restored after closing modals

---

## 🔒 SECURITY TESTING

### Authentication Security
- [ ] Password field is masked (not visible)
- [ ] Token is HttpOnly (check if applicable)
- [ ] Token has expiration time
- [ ] Refresh token mechanism works (if implemented)
- [ ] No credentials visible in console logs

### XSS Prevention
- [ ] HTML injection doesn't execute script
- [ ] Script tags in content are escaped
- [ ] No security warnings in console
- [ ] CSP headers are present

### CSRF Protection
- [ ] Form submissions have CSRF protection (if applicable)
- [ ] Cross-origin requests are properly blocked
- [ ] CORS whitelist is properly configured

---

## 🎨 VISUAL REGRESSION TESTING

### Component Consistency
- [ ] All buttons look consistent
- [ ] All cards have same styling
- [ ] All form inputs look the same
- [ ] Font sizes are consistent
- [ ] Spacing is uniform

### Brand Consistency
- [ ] Logo color is correct (gradient)
- [ ] Primary color (#2563eb) used correctly
- [ ] Secondary color (#7c3aed) used correctly
- [ ] No inconsistent colors
- [ ] Dark mode colors match brand guidelines

### Cross-browser Testing
- [ ] Chrome: Works correctly
- [ ] Firefox: Works correctly
- [ ] Safari: Works correctly
- [ ] Edge: Works correctly
- [ ] Mobile browsers: Works correctly

---

## 📋 FINAL VERIFICATION

### Before Going Live
- [ ] All tests above marked as PASSED
- [ ] No critical bugs remaining
- [ ] Performance is acceptable
- [ ] Security requirements met
- [ ] Database backup created
- [ ] Deployment logs reviewed
- [ ] Team notified of deployment

### Post-Deployment Monitoring (First 24h)
- [ ] Monitor error logs every hour
- [ ] Check CPU/memory usage
- [ ] Verify backup completeness
- [ ] Get user feedback
- [ ] Address any critical issues immediately

### Sign-off
- **Tester Name**: ___________________________
- **Date**: ___________________________
- **Status**: ☐ PASS  ☐ CONDITIONAL PASS  ☐ FAIL

---

## 📝 NOTES

```
[Add any issues found, observations, or follow-up items here]

```

---

## 🎉 SUCCESS CRITERIA

✅ **Phase 1 Deployment is Successful when:**
1. All tests marked PASS
2. No critical bugs identified
3. Performance meets expectations
4. Accessibility requirements met
5. Security standards verified
6. User feedback is positive
7. Monitoring shows stable operation

---

**Test Duration**: ________________  
**Total Issues Found**: ________________  
**Critical Issues**: ________________  
**Next Review Date**: ________________
