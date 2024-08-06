class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.setHeaderCartIconAccessibility();
  }

  setHeaderCartIconAccessibility() {
    const cartLink = document.querySelector("#cart-icon-bubble");

    cartLink.addEventListener("click", (event) => {
      event.preventDefault();
      this.open(cartLink);
    });
  }

  open() {
    console.log("open open ope open ");
    setTimeout(() => {
      this.classList.add("animate", "active");
    });

    document.body.classList.add("overflow-hidden");
  }

  close(fromContinueClick) {
    this.classList.remove("active");

    document.body.classList.remove("overflow-hidden");

    if (fromContinueClick) {
      window.location.href = "/";
    }
  }
}

customElements.define("cart-drawer", CartDrawer);

class CartDrawerItems extends CartItems {}

customElements.define("cart-drawer-items", CartDrawerItems);
