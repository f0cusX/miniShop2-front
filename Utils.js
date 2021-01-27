const empty = (val) => (typeof (val) === 'undefined' || val === 0 || val === null || val === false || (typeof (val) === 'string' && val.replace(/\s+/g, '') === '') || (typeof (val) === 'object' && val.length === 0));

// Format a number with grouped thousands,
const formatNumber = (number, decimals = 2, decPoint = ',', thousandsSep = '.') => {
  // original by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
  // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // bugfix by: Michael White (http://crestidg.com)
  const modifiedDecimals = Math.abs(decimals);
  const modifiedNumber = +number || 0;

  const i = `${parseInt(modifiedNumber.toFixed(modifiedDecimals), 10)}`;

  let j = i.length;
  if (j > 3) {
    j %= 3;
  } else {
    j = 0;
  }

  const km = j
    ? i.substr(0, j) + thousandsSep
    : '';
  const kw = i.substr(j).replace(/(\d{3})(?=\d)/g, `$1${thousandsSep}`);
  const kd = (modifiedDecimals
    ? decPoint + Math.abs(modifiedNumber - i).toFixed(modifiedDecimals).replace(/-/, '0').slice(2)
    : '');

  return km + kw + kd;
};

const formatValue = (value, format, zeroFormat) => {
  let newValue = formatNumber(value, format[0], format[1], format[2]);

  if (zeroFormat && format[0] > 0) {
    newValue = newValue.replace(/(0+)$/, '');
    newValue = newValue.replace(/[^0-9]$/, '');
  }

  return newValue;
};

const getValueFromSerializedArray = (name, arr) => {
  let value = null;
  arr.forEach((element) => {
    if (element.name === name && !value) {
      value = element.value;
    }
  });

  return value;
};

const setDisabled = (element) => {
  if (element) {
    element.setAttribute('disabled', true);
  }
};

const setHidden = (element) => {
  if (element) {
    // eslint-disable-next-line no-param-reassign
    element.hidden = true;
  }
};

const setEnabled = (element) => {
  if (element) {
    element.removeAttribute('disabled');
  }
};

const setShow = (element) => {
  if (element) {
    // eslint-disable-next-line no-param-reassign
    element.hidden = false;
  }
};

const isHidden = (element) => (element.offsetParent === null);

const serializeObjectToUrlString = (obj, prefix) => {
  const str = [];
  Object.keys(obj).forEach((p) => {
    const k = prefix ? `${prefix}[${p}]` : p;
    const v = obj[p];
    str.push((v !== null && typeof v === 'object')
      ? serializeObjectToUrlString(v, k)
      : `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  });
  return str.join('&');
};

const serializeArrayToUrlString = (obj, prefix) => {
  const str = [];
  Object.keys(obj).forEach((p) => {
    const k = prefix ? `${prefix}[${obj[p].name}]` : obj[p].name;
    const v = obj[p].value;
    str.push((v !== null && typeof v === 'object')
      ? serializeObjectToUrlString(v, k)
      : `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  });
  return str.join('&');
};

/*!
 * Serialize all form data into an array of key/value pairs
 * (c) 2020 Chris Ferdinandi, MIT License, https://gomakethings.com
 * @param  {Node}   form The form to serialize
 * @return {Array}       The serialized form data
 */
const serializeFormToArray = (form) => {
  const arr = [];
  Array.prototype.slice.call(form.elements).forEach((field) => {
    if (!field.name || field.disabled || ['file', 'reset', 'submit', 'button'].indexOf(field.type) > -1) return;
    if (field.type === 'select-multiple') {
      Array.prototype.slice.call(field.options).forEach((option) => {
        if (!option.selected) return;
        arr.push({
          name: field.name,
          value: option.value,
        });
      });
      return;
    }
    if (['checkbox', 'radio'].indexOf(field.type) > -1 && !field.checked) return;
    arr.push({
      name: field.name,
      value: field.value,
    });
  });

  return arr;
};

export {
  empty,
  formatValue,
  formatNumber,
  getValueFromSerializedArray,
  setDisabled,
  setEnabled,
  setHidden,
  setShow,
  isHidden,
  serializeObjectToUrlString,
  serializeArrayToUrlString,
  serializeFormToArray,
};
