import Cart from '@modules/MiniShop2/Cart';
import Order from '@modules/MiniShop2/Order';
import { serializeFormToArray, serializeArrayToUrlString, serializeObjectToUrlString } from '@modules/MiniShop2/Utils';

export default class MiniShop2 {
  constructor(config) {
    this.config = config;
    this.ajaxProgress = false;
    this.actionName = 'ms2_action';
    this.action = `button[name='${this.actionName}']`;
    this.form = '.ms2_form';
    this.doc = document;
    this.sendData = {
      $form: null,
      action: null,
      formData: null,
    };
    this.timeout = 300;

    this.config.callbacksObjectTemplate = () => ({
      before: [],
      response: {
        success: [],
        error: [],
      },
      ajax: {
        done: [],
        fail: [],
        always: [],
      },
    });
    // eslint-disable-next-line no-multi-assign
    this.Callbacks = this.config.Callbacks = {
      Cart: {
        add: this.config.callbacksObjectTemplate(),
        remove: this.config.callbacksObjectTemplate(),
        change: this.config.callbacksObjectTemplate(),
        clean: this.config.callbacksObjectTemplate(),
      },
      Order: {
        add: this.config.callbacksObjectTemplate(),
        getcost: this.config.callbacksObjectTemplate(),
        clean: this.config.callbacksObjectTemplate(),
        submit: this.config.callbacksObjectTemplate(),
        getrequired: this.config.callbacksObjectTemplate(),
      },
    };

    this.Order = new Order(this);
    this.Cart = new Cart(this, this.Order);
    this.Callbacks.add = (path, name, func) => {
      if (typeof func !== 'function') {
        return false;
      }
      const modifiedPath = path.split('.');
      let obj = this.Callbacks;
      for (let i = 0; i < modifiedPath.length; i += 1) {
        if (obj[modifiedPath[i]] === undefined) {
          return false;
        }
        obj = obj[modifiedPath[i]];
      }
      if (typeof obj !== 'object') {
        obj = [obj];
      }
      if (name !== undefined) {
        obj[name] = func;
      } else {
        obj.push(func);
      }
      return true;
    };
    this.Callbacks.remove = (path, name) => {
      const modifiedPath = path.split('.');
      let obj = this.Callbacks;
      for (let i = 0; i < path.length; i += 1) {
        if (obj[modifiedPath[i]] === undefined) {
          return false;
        }
        obj = obj[modifiedPath[i]];
      }
      if (obj[name] !== undefined) {
        delete obj[name];
        return true;
      }
      return false;
    };
  }

  initialize() {
    this.setFormListener();
    this.Order.initialize();
    this.Cart.initialize();
  }

  setFormListener() {
    const forms = this.doc.querySelectorAll(this.form);
    if (forms) {
      forms.forEach((form) => {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const action = form.querySelector(this.action).value;
          if (action) {
            const formData = serializeFormToArray(form);
            formData.push({
              name: this.actionName,
              value: action,
            });
            this.sendData = {
              $form: form,
              action,
              formData,
            };
            this.controller();
          }
        });
      });
    }
  }

  controller() {
    switch (this.sendData.action) {
      case 'cart/add':
        this.Cart.add();
        break;
      case 'cart/remove':
        this.Cart.remove();
        break;
      case 'cart/change':
        this.Cart.change();
        break;
      case 'cart/clean':
        this.Cart.clean();
        break;
      case 'order/submit':
        this.Order.submit();
        break;
      case 'order/clean':
        this.Order.clean();
        break;
      default:
    }
  }

  send(data, callbacks, userCallbacks) {
    const runCallback = function (callback, bind) {
      if (typeof callback === 'function') {
        // eslint-disable-next-line prefer-rest-params
        return callback.apply(bind, Array.prototype.slice.call(arguments, 2));
      }
      if (typeof callback === 'object') {
        // eslint-disable-next-line no-restricted-syntax
        for (const i in callback) {
          // eslint-disable-next-line no-prototype-builtins
          if (callback.hasOwnProperty(i)) {
            // eslint-disable-next-line prefer-rest-params
            const response = callback[i].apply(bind, Array.prototype.slice.call(arguments, 2));
            if (response === false) {
              return false;
            }
          }
        }
      }
      return true;
    };
    let modifiedData = data;
    // set context
    if (Array.isArray(modifiedData)) {
      modifiedData.push({
        name: 'ctx',
        value: this.config.ctx,
      });
    } else if (typeof modifiedData === 'object') {
      modifiedData.ctx = this.config.ctx;
    } else if (typeof modifiedData === 'string') {
      modifiedData += `&ctx=${this.config.ctx}`;
    }
    // set action url
    const formActionUrl = (this.sendData.$form)
      ? this.sendData.$form.getAttribute('action')
      : false;
    const url = (formActionUrl) || ((this.config.actionUrl)
      ? this.config.actionUrl
      : document.location.href);
    // set request method
    const formMethod = (this.sendData.$form)
      ? this.sendData.$form.getAttribute('method')
      : false;
    const method = (formMethod) || 'post';

    // callback before
    if (runCallback(callbacks.before) === false || runCallback(userCallbacks.before) === false) {
      return;
    }
    if (Array.isArray(modifiedData)) {
      modifiedData = serializeArrayToUrlString(modifiedData);
    } else if (typeof modifiedData === 'object') {
      modifiedData = serializeObjectToUrlString(modifiedData);
    }
    // send
    const xhr = () => (fetch(url, {
      method,
      body: modifiedData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'x-requested-with': 'XMLHttpRequest',
      },
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          runCallback(callbacks.response.success, this, response);
          runCallback(userCallbacks.response.success, this, response);
        } else {
          runCallback(callbacks.response.error, this, response);
          runCallback(userCallbacks.response.error, this, response);
        }
        runCallback(callbacks.ajax.done, this, xhr);
        runCallback(userCallbacks.ajax.done, this, xhr);
      })
      .catch(() => {
        runCallback(callbacks.ajax.fail, this, xhr);
        runCallback(userCallbacks.ajax.fail, this, xhr);
      })
      .finally(() => {
        runCallback(callbacks.ajax.always, this, xhr);
        runCallback(userCallbacks.ajax.always, this, xhr);
        this.ajaxProgress = false;
      }));
    this.ajaxProgress = true;
    xhr(callbacks, userCallbacks);
  }
}
