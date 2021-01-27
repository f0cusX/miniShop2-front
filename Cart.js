import { formatValue, getValueFromSerializedArray } from '@modules/MiniShop2/Utils';

export default class Cart {
  constructor(miniShop2, Order) {
    this.cart = '#msCart';
    this.miniCart = '#msMiniCart';
    this.miniCartClass = 'msMiniCart';
    this.miniCartNotEmptyClass = 'full';
    this.countInput = 'input[name=count]';
    this.totalWeight = '.ms2_total_weight';
    this.totalCount = '.ms2_total_count';
    this.totalCost = '.ms2_total_cost';
    this.cost = '.ms2_cost';
    this.miniShop2 = miniShop2;
    this.Order = Order;
    this.callbacks = {
      add: this.miniShop2.config.callbacksObjectTemplate(),
      remove: this.miniShop2.config.callbacksObjectTemplate(),
      change: this.miniShop2.config.callbacksObjectTemplate(),
      clean: this.miniShop2.config.callbacksObjectTemplate(),
    };
  }

  initialize() {
    if (!document.querySelectorAll(this.cart).length) {
      return;
    }

    document.querySelector(this.cart).querySelectorAll(this.countInput).forEach((element) => {
      element.addEventListener('change', () => {
        if (element.value) {
          element.closest(this.miniShop2.form).dispatchEvent(new Event('submit'));
        }
      });
    });
  }

  add() {
    const { callbacks } = this;
    callbacks.add.response.success = (response) => {
      this.status(response.data);
    };
    this.miniShop2.send(
      this.miniShop2.sendData.formData,
      this.callbacks.add,
      this.miniShop2.Callbacks.Cart.add,
    );
  }

  remove() {
    const { callbacks } = this;
    callbacks.remove.response.success = (response) => {
      this.removePosition(getValueFromSerializedArray('key', this.miniShop2.sendData.formData));
      this.status(response.data);
    };
    this.miniShop2.send(
      this.miniShop2.sendData.formData,
      this.callbacks.remove,
      this.miniShop2.Callbacks.Cart.remove,
    );
  }

  change() {
    const { callbacks } = this;
    callbacks.change.response.success = (response) => {
      if (typeof (response.data.key) === 'undefined') {
        this.removePosition(getValueFromSerializedArray('key', this.miniShop2.sendData.formData));
      }
      this.status(response.data);
    };
    this.miniShop2.send(
      this.miniShop2.sendData.formData,
      this.callbacks.change,
      this.miniShop2.Callbacks.Cart.change,
    );
  }

  status(status) {
    if (status.total_count < 1) {
      document.location.reload();
    } else {
      const miniCarts = document.querySelectorAll(this.miniCart);
      if (status.total_count > 0 && miniCarts.length > 0) {
        miniCarts.forEach((cart) => {
          cart.classList.add(this.miniCartClass);
          if (!cart.classList.contains(this.miniCartNotEmptyClass)) {
            cart.classList.add(this.miniCartNotEmptyClass);
          }
        });
      }
      document.querySelectorAll(this.totalWeight).forEach((element) => {
        // eslint-disable-next-line no-param-reassign
        element.textContent = formatValue(
          status.total_weight,
          this.miniShop2.config.weight_format,
          this.miniShop2.config.weight_format_no_zeros,
        );
      });
      document.querySelectorAll(this.totalCount).forEach((element) => {
        // eslint-disable-next-line no-param-reassign
        element.textContent = status.total_count;
      });
      document.querySelectorAll(this.totalCost).forEach((element) => {
        // eslint-disable-next-line no-param-reassign
        element.textContent = formatValue(
          status.total_cost,
          this.miniShop2.config.price_format,
          this.miniShop2.config.price_format_no_zeros,
        );
      });
      if (status.cost > 0) {
        document.getElementById(status.key).querySelector(this.cost).textContent = formatValue(
          status.cost,
          this.miniShop2.config.price_format,
          this.miniShop2.config.price_format_no_zeros,
        );
      }
      if (document.querySelector(this.Order.order).querySelector(this.Order.orderCost)) {
        this.Order.getCost();
      }
    }
  }

  clean() {
    const { callbacks } = this;
    callbacks.clean.response.success = (response) => {
      this.status(response.data);
    };

    this.miniShop2.send(
      this.miniShop2.sendData.formData,
      this.callbacks.clean,
      this.miniShop2.Callbacks.Cart.clean,
    );
  }

  // eslint-disable-next-line class-methods-use-this
  removePosition(key) {
    document.getElementById(key).remove();
  }
}
