// popup.js

document.addEventListener("DOMContentLoaded", () => {
  const noDataDiv = document.getElementById("no-data");
  const searchModal = document.getElementById("searchModal");
  const notFoundModal = document.getElementById("notFoundModal");

  // ابتدا، صفحه‌ی فعال را بگیریم تا دامنه را استخراج کنیم
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) {
      noDataDiv.textContent = "Could not detect active tab.";
      return;
    }

    const url = new URL(tabs[0].url);
    const domain = url.hostname.replace(/^www\./, "");

    // از chrome.storage.local داده را بازیابی می‌کنیم
    chrome.storage.local.get(domain, (items) => {
      const data = items[domain];

      // اگر داده اصلاً وجود نداشت یا "null" بود یا شناسه‌اش <= 0
      if (!data || data === "null" || Number(data.id) <= 0) {
        noDataDiv.textContent = "No data found for this domain.";
        return;
      }

      // حالا فرض می‌کنیم data.id > 0 و یک شیء معتبر داریم.
      noDataDiv.style.display = "none";

      // وضعیت enamad_status را به عدد تبدیل می‌کنیم
      const enamadStatus = Number(data.enamad_status);

      // اگر وضعیت بین 1 تا 5 باشد، searchModal را نمایش بده
      if (enamadStatus >= 1 && enamadStatus <= 5) {
        searchModal.style.display = "block";

        // ستاره‌ها
        let starHtml = "";
        if (Number(data.rating) === 0) {
          starHtml = " بدون ";
        } else {
          for (let i = 0; i < Number(data.rating); i++) {
            starHtml += '<i class="fa fa-fw fa-star cyellow"></i> ';
          }
        }

        // پر کردن مقادیر در DOM
        document.getElementById("namepr").innerHTML = data.persian_name;
        document.getElementById("province").innerHTML = data.statename;
        document.getElementById("city").innerHTML = data.cityname;
        document.getElementById("appDate").innerHTML = data.approvedate;
        document.getElementById("expDate").innerHTML = data.expdate;
        document.getElementById("star").innerHTML = starHtml;

        // دکمه‌ی جزئیات بیشتر: بازکردن URL جدید (در یک پنجره/تب جدید)
        document.getElementById("np12").onclick = function () {
          const a = document.createElement("a");
          a.href = "https://trustseal.enamad.ir/?id=" + encodeURIComponent(data.id) + "&Code=" + encodeURIComponent(data.code);
          a.target = "_blank";
          a.rel = "noopener noreferrer"; // always good practice
          a.referrerPolicy = "origin"; // set referrer policy here
          a.click();
        };
      }

      // بر اساس enamad_status یک آیکون و متن وضعیت تنظیم می‌کنیم
      switch (enamadStatus) {
        case 1:
          // وضعیت “معتبر”
          document.getElementById("im").src =
            "https://reg2.enamad.ir/rc/outResource/dist/img/valid.png";
          document.getElementById("status").innerHTML = "معتبر";
          document.getElementById("statusDiv").style.color = "rgb(62 195 30)";
          break;

        case 6:
          // وضعیت “تعلیق شده”
          document.getElementById("wrongmsg").innerHTML =
            "دامنه ای جستجو شده تعلیق شده است";
          notFoundModal.style.display = "block";
          break;

        case 3:
          // وضعیت “معتبر در انتظار ارائه پروانه کسب”
          document.getElementById("im").src =
            "https://reg2.enamad.ir/rc/outResource/dist/img/condition.png";
          document.getElementById("status").innerHTML =
            "معتبر در انتظار ارائه پروانه کسب";
          document.getElementById("statusDiv").style.color = "#ff8100";
          break;

        case 5:
          // وضعیت “منقضی شده”
          document.getElementById("im").src =
            "https://reg2.enamad.ir/rc/outResource/dist/img/condition.png";
          document.getElementById("status").innerHTML = "منقضی شده";
          document.getElementById("statusDiv").style.color = "#ff8100";
          break;

        default:
          // هر وضعیت دیگری (مثلاً 0 یا نامشخص)، هیچ‌کدام از مدال‌ها را نمایش نمی‌دهد
          searchModal.style.display = "none";
          notFoundModal.style.display = "none";
          noDataDiv.style.display = "block";
      }
    });
  });
});
