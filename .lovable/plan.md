

# Add Alert Script to Website

## What You Want
Add a simple script that shows an alert with "HELLO" when the page loads.

## Change
I'll add the script tag just before the closing `</body>` tag, right after your existing widget script.

## File to Modify
**index.html** - Add the following code on line 38:

```html
<script>
  alert("HELLO");
</script>
```

## Result
After this change, every time someone visits your website, they'll see a browser alert popup saying "HELLO" before the page content loads.

## Note
This is typically used for testing purposes. Once you've confirmed it works, you may want to remove it since alert popups can be disruptive to users.

