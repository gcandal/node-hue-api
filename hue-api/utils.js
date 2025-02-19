'use strict';

const HueError = require('../lib/HueError');


//TODO remove this module or refactor

module.exports.nativePromiseOrCallback = function (promise, cb) {
  let promiseResult = promise;

  if (cb && typeof cb === "function") {
    module.exports.resolvePromise(promise, cb);
    // Do not return the promise, as the callbacks will have forced it to resolve
    promiseResult = null;
  }

  return promiseResult;
};


/**
 * Checks the callback and if it is valid, will resolve the promise an utilize the callback to inform of results,
 * otherwise the promise is returned to the caller to chain.
 *
 * @param promise The promise being invoked
 * @param cb The callback function, which is optional
 * @returns {*} The promise if there is not a valid callback, or null, if the callback is used to resolve the promise.
 */
module.exports.promiseOrCallback = function (promise, cb) {
  const promiseResult = promise;

  if (cb && typeof cb === 'function') {
    module.exports.resolvePromise(promise, cb);
    // Do not return the promise, as the callbacks will have forced it to resolve
    return null;
  }

  return promiseResult;
};

/**
 * Terminates a promise chain and invokes a callback with the results.
 *
 * @param promise The promise to terminate
 * @param callback The callback function to invoke
 */
module.exports.resolvePromise = function (promise, callback) {
  function resolveValue(value) {
    if (callback) {
      callback(null, value);
    }
  }

  function resolveError(err) {
    if (callback) {
      callback(err, null);
    }
  }

  promise.catch(resolveError).then(resolveValue);
};

// /**
//  * Combines the specified object with the properties defined in the values object, overwriting any existing values.
//  * @param obj The object to combine the values with
//  * @param values The objects to get the properties and values from, can be many arguments
//  */
// module.exports.combine = function (obj, values) {
//   var argIdx = 1,
//     value,
//     property;
//
//   while (argIdx < arguments.length) {
//     value = arguments[argIdx];
//     for (property in value) {
//       if (value.hasOwnProperty(property)) {
//         obj[property] = value[property];
//       }
//     }
//     argIdx++;
//   }
//
//   return obj;
// };

module.exports.isFunction = function (object) {
  var getClass = {}.toString;

  return object && getClass.call(object) === '[object Function]';
};

/**
 * Parses a JSON response checking for success on all changes.
 * @param result The JSON object to parse for success messages.
 * @returns {boolean} true if all changes were successful.
 */
module.exports.wasSuccessful = function (result) {
  var success = true,
    idx,
    len;

  if (Array.isArray(result)) {
    for (idx = 0, len = result.length; idx < len; idx++) {
      success = success && module.exports.wasSuccessful(result[idx]);
    }
  } else {
    success = result.success !== undefined;
  }
  return success;
};

/**
 * Parses a JSON response looking for the errors in the result(s) returned.
 * @param results The results to look for errors in.
 * @returns {Array} Of errors found.
 */
module.exports.parseErrors = function (results) {
  let errors = [];

  if (Array.isArray(results)) {
    results.forEach(result => {
      if (!result.success) {
        errors = errors.concat(module.exports.parseErrors(result));
      }
    });
  } else {
    if (results.error) {
      // Due to the handling of remote and local errors, we need to differentiate description and message in the errors,
      // as the remote API uses both, whilst local uses only description. -- TODO need to review this
      if (results.error.description && ! results.error.message) {
        const payload = Object.assign({message: results.error.description}, results.error);
        errors.push(new HueError(payload));
      } else {
        errors.push(new HueError(results.error));
      }
    }
  }
  return errors.length > 0 ? errors : null;
};

/**
 * Creates a String Value Array from the provided values.
 * @param values The values to convert to a String value Array.
 * @returns {Array} of strings.
 */
module.exports.createStringValueArray = function (values) {
  var result = [];

  if (Array.isArray(values)) {
    values.forEach(function (value) {
      result.push(_asStringValue(value));
    });
  } else {
    result.push(_asStringValue(values));
  }

  return result;
};

module.exports.valueForType = function (type, value) {
  var result;

  if (type === "bool") {
    result = Boolean(value);
  } else if (type === "uint8" || type === "uint16" || type === "int8" || type === "int16") {
    result = Math.floor(value);

    if (/^uint.*/.test(type) && result < 0) {
      result = 0;
    }
  } else if (type === "string") {
    result = String(value);
  } else if (type === "float") {
    result = Number(value);
  } else if (type === "list") {
    result = Array.isArray(value) ? value : [];
  } else {
    result = value;
  }

  return result;
};

function _asStringValue(value) {
  var result;

  if (typeof (value) === 'string') {
    result = value;
  } else {
    result = String(value);
  }
  return result;
}

module.exports.getStringValue = function (value, maxLength) {
  var result = value || "";

  if (maxLength && result.length > maxLength) {
    result = result.substr(0, maxLength);
  }
  return result;
};