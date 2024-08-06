Shopify.formatMoney = function (cents, format) {
  if (typeof cents == "string") {
    cents = cents.replace(".", "");
  }
  var value = "";
  var placeholderRegex = /{{\s*(\w+)\s*}}/;
  var formatString = format || this.money_format;
  function defaultOption(opt, def) {
    return typeof opt == "undefined" ? def : opt;
  }
  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultOption(precision, 2);
    thousands = defaultOption(thousands, ",");
    decimal = defaultOption(decimal, ".");
    if (isNaN(number) || number == null) {
      return 0;
    }
    number = (number / 100.0).toFixed(precision);
    var parts = number.split("."),
      dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + thousands),
      cents = parts[1] ? decimal + parts[1] : "";
    return dollars + cents;
  }
  switch (formatString.match(placeholderRegex)[1]) {
    case "amount":
      value = formatWithDelimiters(cents, 2);
      break;
    case "amount_no_decimals":
      value = formatWithDelimiters(cents, 0);
      break;
    case "amount_with_comma_separator":
      value = formatWithDelimiters(cents, 2, ".", ",");
      break;
    case "amount_no_decimals_with_comma_separator":
      value = formatWithDelimiters(cents, 0, ".", ",");
      break;
  }
  return formatString.replace(placeholderRegex, value);
};

class CartRemoveButton extends HTMLElement {
  constructor() {
    super();

    this.addEventListener("click", (event) => {
      event.preventDefault();

      const cartItems =
        this.closest("cart-items") || this.closest("cart-drawer-items");
      //
      cartItems.updateQuantity(
        this.dataset.index,
        0,
        null,
        this.querySelector("button").dataset.variantId
      );
    });
  }
}

customElements.define("cart-remove-button", CartRemoveButton);

class CartItems extends HTMLElement {
  constructor() {
    super();

    this.lineItemStatusElement =
      document.getElementById("shopping-cart-line-item-status") ||
      document.getElementById("CartDrawer-LineItemStatus");

    this.attachEvents();
  }




  validateQuantity(input, quantity) {
    const inputValue = parseInt(quantity);
    let message = "";

    if (inputValue > parseInt(input.max)) {
      message = "stock exceded";
    } else if (inputValue % parseInt(input.step) !== 0) {
    }

    if (message) {
    } else {
      this.updateQuantity(
        input.dataset.index,
        inputValue,
        document.activeElement.getAttribute("name"),
        input.dataset.quantityVariantId
      );
    }
  }

  attachEvents(event) {
    this.minusbtn = this.querySelectorAll(".quantity__button[name=minus]");
    this.plusbtn = this.querySelectorAll(".quantity__button[name=plus]");

    const debouncedOnChange = (event) => {
      this.onChange(event);
    };

    const minusButtonClick = (event) => {
      let input = event.target.nextElementSibling;
      if (input.value == 1) {
        return;
      }

      this.validateQuantity(input, +input.value - 1);

      input.value = +input.value - 1;

      if (input.value == 1) {
        event.target.classList.add("disabled");
      }

      // Create a new 'change' event
      const customevent = new Event("change");
      // Dispatch the event
      input.dispatchEvent(customevent);
    };

    const plusButtonClick = (event) => {
      let input = event.target.previousElementSibling;
      input.previousElementSibling.classList.remove("disabled");

      this.validateQuantity(input, +input.value + 1);

      input.value = +input.value + 1;

      // Create a new 'change' event
      const customevent = new Event("change");
      // Dispatch the event
      input.dispatchEvent(customevent);
    };

    console.log("what is this ", this);

    this.addEventListener("change", debouncedOnChange.bind(this));

    this.minusbtn.forEach((minusbtn) => {
      minusbtn.addEventListener("click", minusButtonClick.bind(this));
    });

    this.plusbtn.forEach((plusbtn) => {
      plusbtn.addEventListener("click", plusButtonClick.bind(this));
    });

    // this.validateQuantity(event);
  }

  onCartUpdate(line, variantId, error) {
    console.log("fghjkl ", this.tagName);

    if (this.tagName === "CART-DRAWER-ITEMS") {
      fetch("/cart.js", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          console.log("Cart data: from api ", data);
          this.renderCartItem(data, variantId, error);
          if (line) {
            this.disableLoading(line);
          }
        });
    } else {
    }
  }

  updateQuantity(line, quantity, name, variantId) {
    this.enableLoading(line);

    const body = JSON.stringify({
      id: variantId,
      quantity: +quantity,
    });

    fetch("/cart/change", {
      headers: {
        "content-type": "application/json",
      },
      body: body,
      method: "POST",
    })
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        console.log("second then response ", state);
        let titleMatch = state?.match(/<title>(.*?)<\/title>/);
        let title = titleMatch ? titleMatch?.[1] : "";

        this.onCartUpdate(line, variantId, title);
      })
      .catch((er) => {
        console.log("er from cart change api ", er);
      })
      .finally(() => {});
  }

  

  enableLoading(line) {
    const mainCartItems =
      document.getElementById("main-cart-items") ||
      document.getElementById("CartDrawer-CartItems");

    mainCartItems.classList.add("cart__items--disabled");

    const cartItemElements = this.querySelectorAll(
      `#CartDrawer-Item-${line} .loading__spinner`
    );

    [...cartItemElements].forEach((overlay) =>
      overlay.classList.remove("hidden")
    );

    document.activeElement.blur();
  }

  disableLoading(line) {
    const mainCartItems =
      document.getElementById("main-cart-items") ||
      document.getElementById("CartDrawer-CartItems");
    mainCartItems?.classList?.remove("cart__items--disabled");

    const cartDrawerItemElements = this.querySelectorAll(
      `#CartDrawer-Item-${line} .loading__spinner`
    );

    cartDrawerItemElements?.forEach((overlay) =>
      overlay.classList.add("hidden")
    );
  }

  renderCartItem(cart, variantId, error) {
    let html = "";

    if (cart.item_count == 0) {
      html = `<div class="drawer__inner-empty">
          <div class="cart-drawer__warnings center">
            <div class="cart-drawer__empty-content">
              <h2 class="cart__empty-text">Your cart is empty</h2>
              <button class="drawer__close" type="button" onclick="this.closest('cart-drawer').close()" aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" class="icon icon-close" fill="none" viewBox="0 0 18 17">
                  <path d="M.865 15.978a.5.5 0 00.707.707l7.433-7.431 7.579 7.282a.501.501 0 00.846-.37.5.5 0 00-.153-.351L9.712 8.546l7.417-7.416a.5.5 0 10-.707-.708L8.991 7.853 1.413.573a.5.5 0 10-.693.72l7.563 7.268-7.418 7.417z" fill="currentColor">
                  </path>
                </svg>

              </button>
              
              <button style="max-width:195px;margin:auto;" type="submit" class="product-form__submit product-form__submit--buy   ">
                <span>Continue shopping</span>
    
                <div style="display:none;" class="loading__spinner hidden">
                  <svg aria-hidden="true" focusable="false" class="spinner" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
                    <circle class="path" fill="none" stroke-width="6" cx="33" cy="33" r="30"></circle>
                  </svg>
                </div>
              </button>

            </div>
          </div>
        </div><cart-drawer-items></cart-drawer-items>`;

      document.querySelector("cart-drawer").classList.add("is-empty");
      document.querySelector("cart-drawer-items").classList.add("is-empty");
      document.querySelector(".drawer__cart-items-wrapper").innerHTML = "";
      document.querySelector(".drawer__inner").innerHTML = html;
      document.querySelector(".cart-count-bubble ").style.display = "none";

      return;
    } else {
      document.querySelector("cart-drawer").classList.remove("is-empty");

      cart.items.forEach((item, index) => {
        html += `
                  <tr data-variant-id-row="${item.id}" id="CartDrawer-Item-${
          index + 1
        }" class="cart-item" role="row">
                      <td class="cart-item__media" role="cell" headers="CartDrawer-ColumnProductImage">
                          ${
                            item.image
                              ? `
                          <a href="${
                            item.url
                          }" class="cart-item__link" tabindex="-1" aria-hidden="true"></a>
                          <img
                              class="cart-item__image"
                              src="${item.image}"
                              alt="${item.featured_image.alt}"
                              loading="lazy"
                              width="150"
                              height="${Math.ceil(
                                150 / item.featured_image.aspect_ratio
                              )}"
                          >`
                              : ""
                          }
                      </td>
                      <td class="cart-item__details" role="cell" headers="CartDrawer-ColumnProduct">
                          <a href="${
                            item.url
                          }" class="cart-item__name h4 break">${
          item.product_title
        }</a>
                          ${
                            item.original_price !== item.final_price
                              ? `
                          <div class="cart-item__discounted-prices">
                              <span class="visually-hidden">Regular Price</span>
                              <s class="cart-item__old-price product-option">${item.original_price}</s>
                              <span class="visually-hidden">Sale Price</span>
                              <strong class="cart-item__final-price product-option">${item.final_price}</strong>
                          </div>`
                              : `<div class="product-option">Rs. ${item.presentment_price}</div>`
                          }
                          ${
                            !item.product_has_only_default_variant ||
                            item.properties.size !== 0 ||
                            item.selling_plan_allocation
                              ? `
                          <dl>
                              ${
                                !item.product_has_only_default_variant
                                  ? item.options_with_values
                                      .map(
                                        (option) => `
                              <div class="product-option">
                                  <dt>${option.name}:</dt>
                                  <dd>${option.value}</dd>
                              </div>`
                                      )
                                      .join("")
                                  : ""
                              }
                              ${
                                item.properties
                                  ?.map?.((property) => {
                                    const propertyFirstChar =
                                      property.first.slice(0, 1);
                                    return property.last !== "" &&
                                      propertyFirstChar !== "_"
                                      ? `
                                  <div class="product-option">
                                      <dt>${property.first}:</dt>
                                      <dd>${
                                        property.last.includes("/uploads/")
                                          ? `<a href="${
                                              property.last
                                            }" class="link" target="_blank" aria-describedby="a11y-new-window-message">${property.last
                                              .split("/")
                                              .pop()}</a>`
                                          : property.last
                                      }</dd>
                                  </div>`
                                      : "";
                                  })
                                  .join("") || ""
                              }
                          </dl>
                          <p class="product-option">${
                            item.selling_plan_allocation?.selling_plan?.name ||
                            ""
                          }</p>`
                              : ""
                          }
                          ${
                            item.line_level_discount_allocations.length > 0
                              ? `<ul class="discounts list-unstyled" role="list" aria-label="Discounts">
                                              ${item.line_level_discount_allocations
                                                .map(
                                                  (discount) =>
                                                    `<li class="discounts__discount">${discount.discount_application.title}</li>`
                                                )
                                                .join("")}
                              </ul>`
                              : ""
                          }
                      </td>
                      <td class="cart-item__totals right" role="cell" headers="CartDrawer-ColumnTotal">
                          <div class="loading__spinner hidden">
                            <svg aria-hidden="true" focusable="false" class="spinner" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
                              <circle class="path" fill="none" stroke-width="6" cx="33" cy="33" r="30"></circle>
                            </svg>
                          </div>
                          <div class="cart-item__price-wrapper">
                              ${
                                item.original_line_price !==
                                item.final_line_price
                                  ? `
                              <div class="cart-item__discounted-prices">
                                  <span class="hidden">Regular Price</span>
                                  <s class="cart-item__old-price price price--end">${item.original_line_price}</s>
                                  <span class="hidden">Sale Price</span>
                                  <span class="price price--end">${item.final_line_price}</span>
                              </div>`
                                  : `
                              <span dfgdfg class="price price--end">${Shopify.formatMoney(
                                item.final_line_price
                              )}</span>`
                              }
                              
                          </div>
                      </td>
                      <td class="cart-item__quantity" role="cell" headers="CartDrawer-ColumnQuantity">
                          <quantity-popover>
                              <div class="cart-item__quantity-wrapper quantity-popover-wrapper">
                                  <div class="quantity-popover-container">
                                      <quantity-input class="quantity cart-quantity">
                                          <button class="quantity__button" name="minus" type="button">
                                              <span class="hidden">Decrease Quantity</span>
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                aria-hidden="true"
                                                focusable="false"
                                                class="icon icon-minus"
                                                fill="none"
                                                viewBox="0 0 10 2"
                                              >
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M.5 1C.5.7.7.5 1 .5h8a.5.5 0 110 1H1A.5.5 0 01.5 1z" fill="currentColor">
                                              </svg>

                                          </button>
                                          <input
                                              class="quantity__input"
                                              type="number"
                                              data-quantity-variant-id="${
                                                item.variant_id
                                              }"
                                              name="updates[]"
                                              value="${item.quantity}"
                                              data-cart-quantity="${
                                                item.quantity
                                              }"
                                              data-line-id="${item.id}"
                                              min="0"
                                              aria-label="Quantity"
                                              id="Drawer-quantity-${index + 1}"
                                              data-index="${index + 1}"
                                          >
                                          <button class="quantity__button" name="plus" type="button">
                                              <span class="hidden">Increase Quantity</span>
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                aria-hidden="true"
                                                focusable="false"
                                                class="icon icon-plus"
                                                fill="none"
                                                viewBox="0 0 10 10"
                                              >
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M1 4.51a.5.5 0 000 1h3.5l.01 3.5a.5.5 0 001-.01V5.5l3.5-.01a.5.5 0 00-.01-1H5.5L5.49.99a.5.5 0 00-1 .01v3.5l-3.5.01H1z" fill="currentColor">
                                              </svg>
                                          </button>
                                      </quantity-input>
                                  </div>
                                  <cart-remove-button id="CartDrawer-Remove-${
                                    index + 1
                                  }" data-index="${index + 1}">
                                      <button type="button" class="button button--tertiary cart-remove-button" aria-label="Remove ${
                                        item.title
                                      }" data-variant-id="${item.variant_id}">
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" aria-hidden="true" focusable="false" class="icon icon-remove">
                                        <path d="M14 3h-3.53a3.07 3.07 0 00-.6-1.65C9.44.82 8.8.5 8 .5s-1.44.32-1.87.85A3.06 3.06 0 005.53 3H2a.5.5 0 000 1h1.25v10c0 .28.22.5.5.5h8.5a.5.5 0 00.5-.5V4H14a.5.5 0 000-1zM6.91 1.98c.23-.29.58-.48 1.09-.48s.85.19 1.09.48c.2.24.3.6.36 1.02h-2.9c.05-.42.17-.78.36-1.02zm4.84 11.52h-7.5V4h7.5v9.5z" fill="currentColor"></path>
                                        <path d="M6.55 5.25a.5.5 0 00-.5.5v6a.5.5 0 001 0v-6a.5.5 0 00-.5-.5zM9.45 5.25a.5.5 0 00-.5.5v6a.5.5 0 001 0v-6a.5.5 0 00-.5-.5z" fill="currentColor"></path>
                                      </svg>
                                      </button>
                                  </cart-remove-button>
                              </div>
                          </quantity-popover>
                      </td>
                  </tr>`;
      });

      const drawerHeaderHTML = `
  <div class="drawer__header">
    <h2 class="drawer__heading">Your cart : ${cart.item_count} </h2>
    <button class="drawer__close" type="button" onclick="this.closest('cart-drawer').close()" aria-label="{{ 'accessibility.close' | t }}">
      <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" class="icon icon-close" fill="none" viewBox="0 0 18 17">
          <path d="M.865 15.978a.5.5 0 00.707.707l7.433-7.431 7.579 7.282a.501.501 0 00.846-.37.5.5 0 00-.153-.351L9.712 8.546l7.417-7.416a.5.5 0 10-.707-.708L8.991 7.853 1.413.573a.5.5 0 10-.693.72l7.563 7.268-7.418 7.417z" fill="currentColor">
        </path>
      </svg>
    </button>
  </div>
  <cart-drawer-items>
      <form action="/cart" id="CartDrawer-Form" class="cart__contents cart-drawer__form" method="post">
          <div id="CartDrawer-CartItems" class="drawer__contents js-contents"><div class="drawer__cart-items-wrapper">
                <table class="cart-items" role="table">
                  <thead role="rowgroup">
                    <tr role="row">
                      <th id="CartDrawer-ColumnProductImage" role="columnheader">
                        <span class="hidden">Product image</span>
                      </th>
                      <th id="CartDrawer-ColumnProduct" class="caption-with-letter-spacing" scope="col" role="columnheader">
                        Product
                      </th>
                      <th id="CartDrawer-ColumnTotal" class="right caption-with-letter-spacing" scope="col" role="columnheader">
                        Total
                      </th>
                      <th id="CartDrawer-ColumnQuantity" role="columnheader">
                        <span class="hidden">Quantity</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody role="rowgroup">
                  ${html}
                  </tbody>
                </table>
              </div><p id="CartDrawer-LiveRegionText" class="hidden" role="status"></p>
            <p id="CartDrawer-LineItemStatus" class="hidden" aria-hidden="true" role="status">
              Loading...
            </p>
          </div>
          <div id="CartDrawer-CartErrors" role="alert"></div>
        </form>
      </cart-drawer-items>
      <div class="drawer__footer"><!-- Start blocks -->
        <!-- Subtotals -->

        <div class="cart-drawer__footer">
          <div></div>

          <div class="totals" role="status">
            <h2 class="totals__total">Estimated total</h2>
            <p class="totals__total-value">Rs. 119.96</p>
          </div>

          <small class="tax-note caption-large rte">Taxes, discounts and shipping calculated at checkout.</small>
        </div>

        <!-- CTAs -->

        <div class="cart__ctas">
           
          <button type="submit" class="product-form__submit product-form__submit--buy   ">
            <span>Check out</span>

            <div style="display:none;" class="loading__spinner hidden">
              <svg aria-hidden="true" focusable="false" class="spinner" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
                <circle class="path" fill="none" stroke-width="6" cx="33" cy="33" r="30"></circle>
              </svg>
            </div>
          </button>
        </div>
      </div>`;

      document.querySelector(".drawer__inner").innerHTML = drawerHeaderHTML;
      document.querySelector(".totals__total-value").innerHTML =
        Shopify.formatMoney(cart.total_price);
      document.querySelector(
        ".cart-count-bubble "
      ).innerHTML = `<div class="cart-count-bubble" style="pointer-events: none">
          <span aria-hidden="true">${cart.item_count}</span>
        </div>`;

      if (cart.item_count > 0) {
        document.querySelector(".cart-count-bubble ").style.display = "";
      } else {
        document.querySelector(".cart-count-bubble ").style.display = "none";
      }

      if (error) {
        document
          .querySelector(`[data-variant-id-row="${variantId}"]`)
          .insertAdjacentHTML(
            "beforeend",
            `<div style="
        position: absolute;
        right: 0;
        max-width: 50%;
        top: 50%;
        transform: translateY(-50%);
        color: red;
        " >
        ${error}
        </div>`
          );
      }

      this.attachEvents();
    }
  }
}

customElements.define("cart-items", CartItems);
