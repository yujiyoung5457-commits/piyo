const menuButton = document.querySelector(".menu-button");
const navLinks = document.querySelector("#navLinks");
const pageLinks = document.querySelectorAll(".nav-links a, .page-link");
const pages = document.querySelectorAll(".section-page");
const dateTime = document.querySelector("#dateTime");
const productList = document.querySelector("#productList");
const recommendList = document.querySelector("#recommendList");
let mapLoaded = false;
const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) {
            return;
        }

        entry.target.classList.add("is-visible");
        cardObserver.unobserve(entry.target);
    });
}, {
    threshold: 0.16
});

function updateDateTime() {
    const now = new Date();
    dateTime.textContent = now.toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

function showPage(pageId) {
    const activePage = document.querySelector(`[data-page="${pageId}"]`);

    pages.forEach((page) => {
        page.classList.toggle("is-active", page.dataset.page === pageId);
    });

    if (pageId === "location") {
        initKakaoMap();
    }

    navLinks.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "메뉴 열기");

    if (activePage) {
        activePage.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

function formatPrice(price) {
    return `${price.toLocaleString("ko-KR")}원`;
}

function createProductCard(product) {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
        <div class="product-image">
            <img src="${product.image}" alt="${product.name}" loading="lazy">
            <div class="plush-fallback" aria-hidden="true"></div>
        </div>
        <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.desc}</p>
            <div class="product-meta">
                <strong>${formatPrice(product.price)}</strong>
                <span>${product.category}</span>
            </div>
        </div>
    `;

    const image = card.querySelector("img");
    const fallback = card.querySelector(".plush-fallback");
    fallback.style.display = "none";

    image.addEventListener("error", () => {
        image.classList.add("is-hidden");
        fallback.style.display = "block";
    });

    cardObserver.observe(card);
    return card;
}

async function loadProducts() {
    const response = await fetch("./data/index.js");
    const products = await response.json();

    productList.innerHTML = "";
    recommendList.innerHTML = "";

    products.forEach((product) => {
        productList.appendChild(createProductCard(product));
    });

    products.slice(0, 3).forEach((product) => {
        recommendList.appendChild(createProductCard(product));
    });
}


function initKakaoMap() {
    const mapContainer = document.querySelector("#map");

    if (mapLoaded || !window.kakao || !window.kakao.maps || !mapContainer) {
        return;
    }

    const fallbackPosition = new kakao.maps.LatLng(37.5735, 126.9848);
    mapContainer.innerHTML = "";
    const map = new kakao.maps.Map(mapContainer, {
        center: fallbackPosition,
        level: 3
    });

    const setMarker = (position) => {
        map.setCenter(position);
        new kakao.maps.Marker({
            position,
            map
        });
        mapLoaded = true;
    };

    if (!kakao.maps.services) {
        setMarker(fallbackPosition);
        return;
    }

    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch("서울특별시 종로구 인사동5길 26", (result, status) => {
        if (status === kakao.maps.services.Status.OK) {
            setMarker(new kakao.maps.LatLng(result[0].y, result[0].x));
            return;
        }

        setMarker(fallbackPosition);
    });
}

menuButton.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "메뉴 닫기" : "메뉴 열기");
});

pageLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
        const target = link.getAttribute("href").replace("#", "");

        event.preventDefault();
        showPage(target);
        window.location.hash = target;
    });
});

updateDateTime();
setInterval(updateDateTime, 1000);
loadProducts();

const initialPage = window.location.hash.replace("#", "");
if (["home", "about", "content", "location"].includes(initialPage)) {
    showPage(initialPage);
}

