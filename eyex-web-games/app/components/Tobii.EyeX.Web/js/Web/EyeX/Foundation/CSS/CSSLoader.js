EyeX.CSSLoader = EyeX.Class(function () {
    // private
    var window,
        sheets,
        sheetsLength,
        sheetCache = {},
        cssCache = {};
    
    function loadDataAjaxSync(filePath, mimeType) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", filePath, false);
        if (mimeType) {
            if (xmlhttp.overrideMimeType) {
                xmlhttp.overrideMimeType(mimeType);
            }
        }
        xmlhttp.send();
        if (xmlhttp.status === 200) {
            return xmlhttp.responseText;
        }

        return null;
    }

    function pathDirectory(path) {
        var pathParts;

        if (/\/$1/.test(path)) {
            return path;
        }

        pathParts = path.split("/");
        pathParts.pop();
        return pathParts.join("/");
    }

    function pathCombine(left, right) {
        return left.replace(/\/+$/, "") + "/" + right.replace(/^\/+/, "");
    }

    function pathSmartCombine(left, right) {
        var leftParts = left.split("/"),
            rightParts = right.split("/"),
            leftLength = leftParts.length,
            rightLength = rightParts.length,
            i = 0;

        if (/^https?/.test(right)) {
            return right;
        }

        while (rightParts[i] === ".." && i < rightLength) {
            if (i < leftLength) {
                leftParts.pop();
            }
            rightParts.shift();
        }
        return pathCombine(leftParts.join("/"), rightParts.join("/"));
    }
    
    function loadStyleSheet(url) {
        var loaded,
            sheet,
            rule,
            i,
            importUrl,
            importSheet,
            args;

        try {
            loaded = loadDataAjaxSync(url, "text/css");
            sheet = CSSOM.parse(loaded);
        } catch (e) {
            return null;
        }

        sheet.href = url;

        for (i = sheet.cssRules.length - 1; i >= 0; i--) {
            rule = sheet.cssRules[i];
            if (rule.href) {
                importUrl = pathSmartCombine(pathDirectory(url), rule.href);
                importSheet = loadStyleSheet(importUrl);
                if (!importSheet) {
                    continue;
                }

                args = importSheet.cssRules.slice();
                Array.prototype.splice.call(args, 0, 0, i, 1);
                Array.prototype.splice.apply(sheet.cssRules, args);
            }
        }
        return sheet;
    }
    
    function cacheCssRules(sheet, sheetIndex) {
        var cacheKey,
            cacheLength,
            len,
            i,
            rule,
            match,
            selector;

        cacheKey = sheet.href || this.window.location.href + sheetIndex;
        if (!cssCache[cacheKey]) {
            cssCache[cacheKey] = [];
        }

        cacheLength = cssCache[cacheKey].length;
        if (cacheLength > 0) {
            return;
        }

        
        for (i = 0, len = sheet.cssRules.length; i < len; i++) {
            rule = sheet.cssRules[i];
            if (!rule) {
                continue;
            }

            if (!rule.style) {
                // rule is not CSSStyleRule
                continue;
            }

            match = false;
            if (rule.style.cursor) {
                switch (rule.style.cursor) {
                    case "auto":
                    case "default":
                    case "none":
                        if (rule.selectorText.indexOf(":hover") > 0) {
                            match = true;
                        }
                        break;
                    case "text":
                        // might be used for detecting input element
                        // but will also give many false positives (ie. Google Drive PDF pages)
                        break;
                    default:
                        match = true;
                        break;
                }
            }

            if (match) {
                // remove pseudo selectors since we can not query them
                selector = rule.selectorText.replace(/\:hover/g, "").replace(/\:focus/g, "");
                //if (selector.indexOf(":") < 0) {
                    cssCache[cacheKey].push(selector);
                //}
            }
        }
    }

    function loadAllCss() {
        var sheet,
            sheetUrl,
            i;

        sheets = this.window.document.styleSheets,
        sheetsLength = sheets.length;

        for (i = 0; i < sheetsLength; i++) {
            sheet = sheets[i];
            if (!sheet) {
                continue;
            }

            if (!sheet.cssRules) {
                // can not access sheet rules, try load from url
                sheetUrl = sheet.href;
                if (sheetUrl) {
                    sheet = sheetCache.hasOwnProperty(sheetUrl) ? sheetCache[sheetUrl] : null;
                    if (!sheet) {
                        sheet = loadStyleSheet(sheetUrl);
                        sheetCache[sheetUrl] = sheet;
                    }
                } else {
                    continue;
                }
            }

            if (sheet) {
                cacheCssRules(sheet, i);
            }
        }
    }

    // public
    return {
        constructor: function (win) {
            this.window = win;
            loadAllCss();
        },
        
        getActivatableSelectors: function () {
            var prop,
                rules,
                i,
                len,
                selectors = [];

            for (prop in cssCache) {
                if (cssCache.hasOwnProperty(prop)) {
                    rules = cssCache[prop];
                    for (i = 0, len = rules.length; i < len; i++) {
                        selectors.push(rules[i]);
                    }
                }
            }
            return selectors.length === 0 ? null : selectors;
        },
        
    };
});

EyeX.css = new EyeX.CSSLoader(window);