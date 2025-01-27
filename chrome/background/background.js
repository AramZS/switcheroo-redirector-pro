class LocalRulesService {
  getRules(key) {
    let stroredRules = localStorage[key];
    if (!stroredRules) {
      return [];
    }
    return JSON.parse(stroredRules);
  }
  setRules(commonRules, fewRules) {
    localStorage["commonRules"] = JSON.stringify(commonRules);
    localStorage["fewRules"] = JSON.stringify(fewRules);
  }
}

class RuleMatcher {
  constructor(rules) {
    this.lastRequestId = null;
    this.rules = rules;
  }

  redirectOnMatch(request) {
    let rule = _.find(this.rules, rule => {
      return (
        rule.isActive &&
        request.url.indexOf(rule.from) > -1 &&
        request.requestId !== this.lastRequestId
      );
    });

    if (rule) {
      this.lastRequestId = request.requestId;
      return {
        redirectUrl: request.url.replace(rule.from, rule.to)
      };
    }
  }
}

//显示一个桌面通知
function showDataOnPage(id, data, link) {
  if (window.webkitNotifications) {
    var notification = window.webkitNotifications.createNotification(
      "images/switch128.png",
      "Switcheroo Redirector Pro",
      data
    );
    notification.show();
    setTimeout(function() {
      notification.cancel();
    }, 5000);
  } else if (chrome.notifications) {
    var opt = {
      type: "basic",
      title: "Switcheroo Redirector Pro",
      message: data,
      iconUrl: "images/switch128.png"
    };
    chrome.notifications.create("", opt, function(id) {
      chrome.notifications.onClicked.addListener(function() {
        chrome.notifications.clear(id);
        // window.open(link);
      });

      setTimeout(function() {
        chrome.notifications.clear(id);
      }, 5000);
    });
  } else {
  }
}

if (!localStorage["isProxy"]) {
  localStorage["isProxy"] = "true";
}

if (!localStorage["allScriptLinks"]) {
  localStorage["allScriptLinks"] = JSON.stringify([]);
}
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  sendResponse({ proxyUrl: localStorage["proxyUrl"] });
  let currentUrl = request.currentUrl;
  let proxyUrl = localStorage["proxyUrl"];

  if (
    new RegExp(currentUrl, "g").test(proxyUrl) &&
    JSON.parse(localStorage["isProxy"]) &&
    JSON.parse(localStorage["commonRules"]).length
  ) {
    showDataOnPage(
      1000,
      "Switcheroo Redirector Pro 正在为您代理中！",
      "https://github.com/jawil/redirect"
    );
  }
});

chrome.webRequest.onBeforeRequest.addListener(
  details => {
    const isProxy = JSON.parse(localStorage["isProxy"]);
    if (isProxy) {
      const rules = new LocalRulesService().getRules("commonRules");
      const ruleMatcher = new RuleMatcher(rules);
      return ruleMatcher.redirectOnMatch(details);
    }
  },
  {
    urls: ["<all_urls>"]
  },
  ["blocking"]
);
