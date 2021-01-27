import {
  setShow, setHidden, setEnabled, setDisabled, isHidden, formatValue,
} from '@modules/MiniShop2/Utils';

export default class Order {
  constructor(miniShop2) {
    this.order = '#msOrder';
    this.deliveries = '#deliveries';
    this.payments = '#payments';
    this.deliveryInput = 'input[name="delivery"]';
    this.inputParent = '.input-parent';
    // this.inputParent = '.form__field';
    // this.paymentInput = 'select[name="payment"]';
    this.paymentInput = 'input[name="payment"]';
    this.paymentInputUniquePrefix = 'input#payment_';
    this.deliveryInputUniquePrefix = 'input#delivery_';
    this.orderCost = '#ms2_order_cost';
    this.doc = document.querySelector(this.order);
    this.miniShop2 = miniShop2;
    this.callbacks = {
      add: this.miniShop2.config.callbacksObjectTemplate(),
      getcost: this.miniShop2.config.callbacksObjectTemplate(),
      clean: this.miniShop2.config.callbacksObjectTemplate(),
      submit: this.miniShop2.config.callbacksObjectTemplate(),
      getrequired: this.miniShop2.config.callbacksObjectTemplate(),
    };
  }

  initialize() {
    if (this.doc) {
      const orderClears = this.doc.querySelectorAll(`[name="${this.miniShop2.actionName}"][value="order/clean"]`);
      if (orderClears) {
        orderClears.forEach((orderClear) => {
          orderClear.addEventListener('click', (e) => {
            this.clean();
            e.preventDefault();
          });
        });
      }
      const fields = this.doc.querySelectorAll('input, textarea');
      if (fields) {
        fields.forEach((field) => {
          field.addEventListener('change', () => {
            const key = field.getAttribute('name');
            const { value } = field;
            this.add(key, value);
          });
        });
      }
      const deliveryInputs = this.doc.querySelectorAll(`${this.deliveryInput}`);
      if (deliveryInputs) {
        const deliveryInputChecked = Array.from(deliveryInputs).find(
          (deliveryInput) => deliveryInput.checked,
        );
        if (deliveryInputChecked) {
          deliveryInputChecked.checked = true;
          deliveryInputChecked.dispatchEvent(new Event('change'));
        }
      }
    }
  }

  add(key, value) {
    const { callbacks } = this;
    const oldValue = value;
    callbacks.add.response.success = (response) => {
      (() => {
        let field = this.doc.querySelector(`[name="${key}"]`);
        switch (key) {
          case 'delivery':
            field = this.doc.querySelector(`${this.deliveryInputUniquePrefix}${response.data[key]}`);
            if (response.data[key] !== oldValue) {
              field.dispatchEvent(new Event('click'));
            } else {
              this.getrequired(value);
              this.updatePayments(field.dataset.payments);
              this.getCost();
            }
            break;
          case 'payment':
            field = this.doc.querySelector(`${this.paymentInputUniquePrefix}${response.data[key]}`);
            if (response.data[key] !== oldValue) {
              field.dispatchEvent(new Event('click'));
            } else {
              this.getCost();
            }
            break;
          default:
        }
        let newValue = response.data[key];
        if (newValue === '') {
          if (Number.isFinite(Number(oldValue))) {
            newValue = 0;
          }
        }
        // eslint-disable-next-line max-len
        // TODO: если 2 поля с одинаковым неймом (например, радио) делает у обоих радио одно значение
        field.value = newValue;
        field.classList.remove('error');
        const fieldParent = field.closest(this.inputParent);
        if (fieldParent) {
          fieldParent.classList.remove('error');
        }
      })(key, value, oldValue);
    };
    callbacks.add.response.error = () => {
      (() => {
        const field = this.doc.querySelector(`[name="${key}"]`);
        if (field.getAttribute('type') === 'checkbox' || field.getAttribute('type') === 'radio') {
          const fieldParent = field.closest(this.inputParent);
          if (fieldParent) {
            fieldParent.classList.add('error');
          }
        } else {
          field.classList.add('error');
        }
      })(key);
    };

    const data = {
      key,
      value,
    };
    data[this.miniShop2.actionName] = 'order/add';
    this.miniShop2.send(
      data,
      this.callbacks.add,
      this.miniShop2.Callbacks.Order.add,
    );
  }

  updatePayments(payments) {
    const paymentsArray = JSON.parse(payments);
    const paymentInputs = this.doc.querySelectorAll(`${this.paymentInput}`);
    paymentInputs.forEach((paymentInput) => {
      setDisabled(paymentInput);
      if (paymentInput.getAttribute('type') === 'checkbox' || paymentInput.getAttribute('type') === 'radio') {
        setHidden(paymentInput.closest(this.inputParent));
      }
      if (payments.length > 0) {
        const filteredPaymentInput = paymentsArray.filter((payment) => `${this.paymentInputUniquePrefix}${payment}` === `${paymentInput.tagName.toLowerCase()}#${paymentInput.id}`);
        if (filteredPaymentInput.length) {
          const filteredPaymentInputId = filteredPaymentInput[0];
          const element = this.doc.querySelector(`${this.paymentInputUniquePrefix}${filteredPaymentInputId}`);
          setEnabled(element);
          if (element.getAttribute('type') === 'checkbox' || element.getAttribute('type') === 'radio') {
            setShow(element.closest(this.inputParent));
          }
        }
      }
    });
    const checkedVisiblePaymentInputs = Array.from(paymentInputs).filter(
      (paymentInput) => !isHidden(paymentInput) && paymentInput.checked,
    );
    if (checkedVisiblePaymentInputs.length === 0) {
      let checkedVisiblePaymentInput;
      paymentInputs.forEach((paymentInput) => {
        if (!isHidden(paymentInput) && (typeof checkedVisiblePaymentInput === 'undefined')) {
          checkedVisiblePaymentInput = paymentInput;
        }
      });
      if (checkedVisiblePaymentInput) {
        checkedVisiblePaymentInput.checked = true;
        checkedVisiblePaymentInput.dispatchEvent(new Event('change'));
      }
    }
  }

  getCost() {
    const { callbacks } = this;
    callbacks.getcost.response.success = (response) => {
      this.doc.querySelectorAll(this.orderCost).forEach((element) => {
        // eslint-disable-next-line no-param-reassign
        element.textContent = formatValue(
          response.data.cost,
          this.miniShop2.config.price_format,
          this.miniShop2.config.price_format_no_zeros,
        );
      });
    };
    const data = {};
    data[this.miniShop2.actionName] = 'order/getcost';
    this.miniShop2.send(
      data,
      this.callbacks.getcost,
      this.miniShop2.Callbacks.Order.getcost,
    );
  }

  clean() {
    const { callbacks } = this;
    callbacks.clean.response.success = () => {
      window.location.reload();
    };

    const data = {};
    data[this.miniShop2.actionName] = 'order/clean';
    this.miniShop2.send(
      data,
      this.callbacks.clean,
      this.miniShop2.Callbacks.Order.clean,
    );
  }

  submit() {
    // miniShop2.Message.close();

    if (this.miniShop2.ajaxProgress) {
      this.submit();
    }

    const { callbacks } = this;
    this.callbacks.submit.before = () => {
      this.doc.querySelectorAll('button, a').forEach((element) => {
        setDisabled(element);
      });
    };
    callbacks.submit.response.success = (response) => {
      if (response.data.redirect) {
        document.location.href = response.data.redirect;
      } else if (response.data.msorder) {
        document.location.href = `${document.location.origin + document.location.pathname
          + (document.location.search ? `${document.location.search}&` : '?')
        }msorder=${response.data.msorder}`;
      } else {
        document.location.reload();
      }
    };
    callbacks.submit.response.error = (response) => {
      setTimeout((() => {
        this.doc.querySelectorAll('button, a').forEach((element) => {
          setEnabled(element);
        });
      }), 3 * this.miniShop2.timeout);
      this.doc.querySelectorAll('[name]').forEach((element) => {
        element.classList.remove('error');
        element.closest(this.inputParent).classList.remove('error');
      });
      response.data.forEach((element) => {
        const key = response.data[element];
        const field = this.doc.querySelector(`[name="${key}"]`);
        if (field.getAttribute('type') === 'checkbox' || field.getAttribute('type') === 'radio') {
          field.closest(this.inputParent).classList.add('error');
        } else {
          field.classList.add('error');
        }
      });
    };
    return this.miniShop2.send(
      this.miniShop2.sendData.formData,
      this.callbacks.submit,
      this.miniShop2.Callbacks.Order.submit,
    );
  }

  getrequired(value) {
    const { callbacks } = this;
    callbacks.getrequired.response.success = (response) => {
      const { requires } = response.data;
      if (requires) {
        requires.forEach((require) => {
          const element = this.doc.querySelector(`[name=${require}]`);
          element.classList.add('required');
          const elementParent = element.closest(this.inputParent);
          if (elementParent) {
            elementParent.classList.add('required');
          }
        });
      }
    };
    callbacks.getrequired.response.error = () => {
      const fields = this.doc.querySelectorAll('[name]');
      if (fields.length) {
        fields.forEach((field) => {
          field.classList.remove('required');
          const fieldParent = field.closest(this.inputParent);
          if (fieldParent) {
            fieldParent.classList.remove('required');
          }
        });
      }
    };

    const data = {
      id: value,
    };
    data[this.miniShop2.actionName] = 'order/getrequired';
    this.miniShop2.send(
      data,
      this.callbacks.getrequired,
      this.miniShop2.Callbacks.Order.getrequired,
    );
  }
}
