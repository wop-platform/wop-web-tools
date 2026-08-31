"use strict";
function _array_like_to_array(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes(arr) {
    if (Array.isArray(arr)) return arr;
}
function _array_without_holes(arr) {
    if (Array.isArray(arr)) return _array_like_to_array(arr);
}
function _assert_this_initialized(self) {
    if (self === void 0) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }
    return self;
}
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(_next, _throw);
    }
}
function _async_to_generator(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(undefined);
        });
    };
}
function _class_call_check(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}
function _construct(Parent, args, Class) {
    if (_is_native_reflect_construct()) {
        _construct = Reflect.construct;
    } else {
        _construct = function construct(Parent, args, Class) {
            var a = [
                null
            ];
            a.push.apply(a, args);
            var Constructor = Function.bind.apply(Parent, a);
            var instance = new Constructor();
            if (Class) _set_prototype_of(instance, Class.prototype);
            return instance;
        };
    }
    return _construct.apply(null, arguments);
}
function _defineProperties(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _create_class(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
}
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _get_prototype_of(o) {
    _get_prototype_of = Object.setPrototypeOf ? Object.getPrototypeOf : function getPrototypeOf(o) {
        return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _get_prototype_of(o);
}
function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of(subClass, superClass);
}
function _instanceof(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
}
function _is_native_function(fn) {
    return Function.toString.call(fn).indexOf("[native code]") !== -1;
}
function _iterable_to_array(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}
function _iterable_to_array_limit(arr, i) {
    var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
    if (_i == null) return;
    var _arr = [];
    var _n = true;
    var _d = false;
    var _s, _e;
    try {
        for(_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true){
            _arr.push(_s.value);
            if (i && _arr.length === i) break;
        }
    } catch (err) {
        _d = true;
        _e = err;
    } finally{
        try {
            if (!_n && _i["return"] != null) _i["return"]();
        } finally{
            if (_d) throw _e;
        }
    }
    return _arr;
}
function _non_iterable_rest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _non_iterable_spread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _object_spread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        if (enumerableOnly) {
            symbols = symbols.filter(function(sym) {
                return Object.getOwnPropertyDescriptor(object, sym).enumerable;
            });
        }
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _possible_constructor_return(self, call) {
    if (call && (_type_of(call) === "object" || typeof call === "function")) {
        return call;
    }
    return _assert_this_initialized(self);
}
function _set_prototype_of(o, p) {
    _set_prototype_of = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of(o, p);
}
function _sliced_to_array(arr, i) {
    return _array_with_holes(arr) || _iterable_to_array_limit(arr, i) || _unsupported_iterable_to_array(arr, i) || _non_iterable_rest();
}
function _to_consumable_array(arr) {
    return _array_without_holes(arr) || _iterable_to_array(arr) || _unsupported_iterable_to_array(arr) || _non_iterable_spread();
}
function _type_of(obj) {
    "@swc/helpers - typeof";
    return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
function _unsupported_iterable_to_array(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array(o, minLen);
}
function _wrap_native_super(Class) {
    var _cache = typeof Map === "function" ? new Map() : undefined;
    _wrap_native_super = function wrapNativeSuper(Class) {
        if (Class === null || !_is_native_function(Class)) return Class;
        if (typeof Class !== "function") {
            throw new TypeError("Super expression must either be null or a function");
        }
        if (typeof _cache !== "undefined") {
            if (_cache.has(Class)) return _cache.get(Class);
            _cache.set(Class, Wrapper);
        }
        function Wrapper() {
            return _construct(Class, arguments, _get_prototype_of(this).constructor);
        }
        Wrapper.prototype = Object.create(Class.prototype, {
            constructor: {
                value: Wrapper,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        return _set_prototype_of(Wrapper, Class);
    };
    return _wrap_native_super(Class);
}
function _is_native_reflect_construct() {
    if (typeof Reflect === "undefined" || !Reflect.construct) return false;
    if (Reflect.construct.sham) return false;
    if (typeof Proxy === "function") return true;
    try {
        Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
        return true;
    } catch (e) {
        return false;
    }
}
function _create_super(Derived) {
    var hasNativeReflectConstruct = _is_native_reflect_construct();
    return function _createSuperInternal() {
        var Super = _get_prototype_of(Derived), result;
        if (hasNativeReflectConstruct) {
            var NewTarget = _get_prototype_of(this).constructor;
            result = Reflect.construct(Super, arguments, NewTarget);
        } else {
            result = Super.apply(this, arguments);
        }
        return _possible_constructor_return(this, result);
    };
}
function _ts_generator(thisArg, body) {
    var f, y, t, g, _ = {
        label: 0,
        sent: function() {
            if (t[0] & 1) throw t[1];
            return t[1];
        },
        trys: [],
        ops: []
    };
    return g = {
        next: verb(0),
        "throw": verb(1),
        "return": verb(2)
    }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
    }), g;
    function verb(n) {
        return function(v) {
            return step([
                n,
                v
            ]);
        };
    }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while(_)try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [
                op[0] & 2,
                t.value
            ];
            switch(op[0]){
                case 0:
                case 1:
                    t = op;
                    break;
                case 4:
                    _.label++;
                    return {
                        value: op[1],
                        done: false
                    };
                case 5:
                    _.label++;
                    y = op[1];
                    op = [
                        0
                    ];
                    continue;
                case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                        _ = 0;
                        continue;
                    }
                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                        _.label = op[1];
                        break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                        _.label = t[1];
                        t = op;
                        break;
                    }
                    if (t && _.label < t[2]) {
                        _.label = t[2];
                        _.ops.push(op);
                        break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();
                    continue;
            }
            op = body.call(thisArg, _);
        } catch (e) {
            op = [
                6,
                e
            ];
            y = 0;
        } finally{
            f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return {
            value: op[0] ? op[1] : void 0,
            done: true
        };
    }
}
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = function(obj, key, value) {
    return key in obj ? __defProp(obj, key, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: value
    }) : obj[key] = value;
};
var __export = function(target, all) {
    for(var name in all)__defProp(target, name, {
        get: all[name],
        enumerable: true
    });
};
var __copyProps = function(to, from, except, desc) {
    if (from && typeof from === "object" || typeof from === "function") {
        var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
        try {
            var _loop = function() {
                var key = _step.value;
                if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
                    get: function() {
                        return from[key];
                    },
                    enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
                });
            };
            for(var _iterator = __getOwnPropNames(from)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true)_loop();
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally{
            try {
                if (!_iteratorNormalCompletion && _iterator.return != null) {
                    _iterator.return();
                }
            } finally{
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    }
    return to;
};
var __toESM = function(mod2, isNodeMode, target) {
    return target = mod2 != null ? __create(__getProtoOf(mod2)) : {}, __copyProps(// If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod2 || !mod2.__esModule ? __defProp(target, "default", {
        value: mod2,
        enumerable: true
    }) : target, mod2);
};
var __toCommonJS = function(mod2) {
    return __copyProps(__defProp({}, "__esModule", {
        value: true
    }), mod2);
};
var __publicField = function(obj, key, value) {
    __defNormalProp(obj, (typeof key === "undefined" ? "undefined" : _type_of(key)) !== "symbol" ? key + "" : key, value);
    return value;
};
// src/index.ts
var src_exports = {};
__export(src_exports, {
    hkdf: function() {
        return hkdf2;
    },
    kdf: function() {
        return kdf;
    },
    sm2: function() {
        return sm2_exports;
    },
    sm3: function() {
        return sm32;
    },
    sm4: function() {
        return sm4_exports;
    }
});
module.exports = __toCommonJS(src_exports);
// src/sm2/index.ts
var sm2_exports = {};
__export(sm2_exports, {
    EmptyArray: function() {
        return EmptyArray;
    },
    arrayToHex: function() {
        return arrayToHex;
    },
    arrayToUtf8: function() {
        return arrayToUtf8;
    },
    calculateSharedKey: function() {
        return calculateSharedKey;
    },
    comparePublicKeyHex: function() {
        return comparePublicKeyHex;
    },
    compressPublicKeyHex: function() {
        return compressPublicKeyHex;
    },
    doDecrypt: function() {
        return doDecrypt;
    },
    doEncrypt: function() {
        return doEncrypt;
    },
    doSignature: function() {
        return doSignature;
    },
    doVerifySignature: function() {
        return doVerifySignature;
    },
    ecdh: function() {
        return getSharedSecret;
    },
    generateKeyPairHex: function() {
        return generateKeyPairHex;
    },
    getHash: function() {
        return getHash;
    },
    getPoint: function() {
        return getPoint;
    },
    getPublicKeyFromPrivateKey: function() {
        return getPublicKeyFromPrivateKey;
    },
    getZ: function() {
        return getZ;
    },
    hexToArray: function() {
        return hexToArray;
    },
    initRNGPool: function() {
        return initRNGPool;
    },
    leftPad: function() {
        return leftPad;
    },
    precomputePublicKey: function() {
        return precomputePublicKey;
    },
    utf8ToHex: function() {
        return utf8ToHex;
    },
    verifyPublicKey: function() {
        return verifyPublicKey;
    }
});
// node_modules/.pnpm/@noble+curves@1.1.0/node_modules/@noble/curves/esm/abstract/utils.js
var utils_exports = {};
__export(utils_exports, {
    bitGet: function() {
        return bitGet;
    },
    bitLen: function() {
        return bitLen;
    },
    bitMask: function() {
        return bitMask;
    },
    bitSet: function() {
        return bitSet;
    },
    bytesToHex: function() {
        return bytesToHex;
    },
    bytesToNumberBE: function() {
        return bytesToNumberBE;
    },
    bytesToNumberLE: function() {
        return bytesToNumberLE;
    },
    concatBytes: function() {
        return concatBytes;
    },
    createHmacDrbg: function() {
        return createHmacDrbg;
    },
    ensureBytes: function() {
        return ensureBytes;
    },
    equalBytes: function() {
        return equalBytes;
    },
    hexToBytes: function() {
        return hexToBytes;
    },
    hexToNumber: function() {
        return hexToNumber;
    },
    numberToBytesBE: function() {
        return numberToBytesBE;
    },
    numberToBytesLE: function() {
        return numberToBytesLE;
    },
    numberToHexUnpadded: function() {
        return numberToHexUnpadded;
    },
    numberToVarBytesBE: function() {
        return numberToVarBytesBE;
    },
    utf8ToBytes: function() {
        return utf8ToBytes;
    },
    validateObject: function() {
        return validateObject;
    }
});
var _0n = BigInt(0);
var _1n = BigInt(1);
var _2n = BigInt(2);
var u8a = function(a) {
    return _instanceof(a, Uint8Array);
};
var hexes = Array.from({
    length: 256
}, function(v, i) {
    return i.toString(16).padStart(2, "0");
});
function bytesToHex(bytes2) {
    if (!u8a(bytes2)) throw new Error("Uint8Array expected");
    var hex = "";
    for(var i = 0; i < bytes2.length; i++){
        hex += hexes[bytes2[i]];
    }
    return hex;
}
function numberToHexUnpadded(num) {
    var hex = num.toString(16);
    return hex.length & 1 ? "0".concat(hex) : hex;
}
function hexToNumber(hex) {
    if (typeof hex !== "string") throw new Error("hex string expected, got " + (typeof hex === "undefined" ? "undefined" : _type_of(hex)));
    return BigInt(hex === "" ? "0" : "0x".concat(hex));
}
function hexToBytes(hex) {
    if (typeof hex !== "string") throw new Error("hex string expected, got " + (typeof hex === "undefined" ? "undefined" : _type_of(hex)));
    var len = hex.length;
    if (len % 2) throw new Error("padded hex string expected, got unpadded hex of length " + len);
    var array = new Uint8Array(len / 2);
    for(var i = 0; i < array.length; i++){
        var j = i * 2;
        var hexByte = hex.slice(j, j + 2);
        var byte = Number.parseInt(hexByte, 16);
        if (Number.isNaN(byte) || byte < 0) throw new Error("Invalid byte sequence");
        array[i] = byte;
    }
    return array;
}
function bytesToNumberBE(bytes2) {
    return hexToNumber(bytesToHex(bytes2));
}
function bytesToNumberLE(bytes2) {
    if (!u8a(bytes2)) throw new Error("Uint8Array expected");
    return hexToNumber(bytesToHex(Uint8Array.from(bytes2).reverse()));
}
function numberToBytesBE(n, len) {
    return hexToBytes(n.toString(16).padStart(len * 2, "0"));
}
function numberToBytesLE(n, len) {
    return numberToBytesBE(n, len).reverse();
}
function numberToVarBytesBE(n) {
    return hexToBytes(numberToHexUnpadded(n));
}
function ensureBytes(title, hex, expectedLength) {
    var res;
    if (typeof hex === "string") {
        try {
            res = hexToBytes(hex);
        } catch (e) {
            throw new Error("".concat(title, ' must be valid hex string, got "').concat(hex, '". Cause: ').concat(e));
        }
    } else if (u8a(hex)) {
        res = Uint8Array.from(hex);
    } else {
        throw new Error("".concat(title, " must be hex string or Uint8Array"));
    }
    var len = res.length;
    if (typeof expectedLength === "number" && len !== expectedLength) throw new Error("".concat(title, " expected ").concat(expectedLength, " bytes, got ").concat(len));
    return res;
}
function concatBytes() {
    for(var _len = arguments.length, arrays = new Array(_len), _key = 0; _key < _len; _key++){
        arrays[_key] = arguments[_key];
    }
    var r = new Uint8Array(arrays.reduce(function(sum, a) {
        return sum + a.length;
    }, 0));
    var pad = 0;
    arrays.forEach(function(a) {
        if (!u8a(a)) throw new Error("Uint8Array expected");
        r.set(a, pad);
        pad += a.length;
    });
    return r;
}
function equalBytes(b1, b2) {
    if (b1.length !== b2.length) return false;
    for(var i = 0; i < b1.length; i++)if (b1[i] !== b2[i]) return false;
    return true;
}
function utf8ToBytes(str) {
    if (typeof str !== "string") throw new Error("utf8ToBytes expected string, got ".concat(typeof str === "undefined" ? "undefined" : _type_of(str)));
    return new Uint8Array(new TextEncoder().encode(str));
}
function bitLen(n) {
    var len;
    for(len = 0; n > _0n; n >>= _1n, len += 1);
    return len;
}
function bitGet(n, pos) {
    return n >> BigInt(pos) & _1n;
}
var bitSet = function(n, pos, value) {
    return n | (value ? _1n : _0n) << BigInt(pos);
};
var bitMask = function(n) {
    return (_2n << BigInt(n - 1)) - _1n;
};
var u8n = function(data) {
    return new Uint8Array(data);
};
var u8fr = function(arr) {
    return Uint8Array.from(arr);
};
function createHmacDrbg(hashLen, qByteLen, hmacFn) {
    if (typeof hashLen !== "number" || hashLen < 2) throw new Error("hashLen must be a number");
    if (typeof qByteLen !== "number" || qByteLen < 2) throw new Error("qByteLen must be a number");
    if (typeof hmacFn !== "function") throw new Error("hmacFn must be a function");
    var v = u8n(hashLen);
    var k = u8n(hashLen);
    var i = 0;
    var reset = function() {
        v.fill(1);
        k.fill(0);
        i = 0;
    };
    var h = function() {
        for(var _len = arguments.length, b = new Array(_len), _key = 0; _key < _len; _key++){
            b[_key] = arguments[_key];
        }
        return hmacFn.apply(void 0, [
            k,
            v
        ].concat(_to_consumable_array(b)));
    };
    var reseed = function() {
        var seed = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : u8n();
        k = h(u8fr([
            0
        ]), seed);
        v = h();
        if (seed.length === 0) return;
        k = h(u8fr([
            1
        ]), seed);
        v = h();
    };
    var gen = function() {
        if (i++ >= 1e3) throw new Error("drbg: tried 1000 values");
        var len = 0;
        var out = [];
        while(len < qByteLen){
            v = h();
            var sl = v.slice();
            out.push(sl);
            len += v.length;
        }
        return concatBytes.apply(void 0, _to_consumable_array(out));
    };
    var genUntil = function(seed, pred) {
        reset();
        reseed(seed);
        var res = void 0;
        while(!(res = pred(gen())))reseed();
        reset();
        return res;
    };
    return genUntil;
}
var validatorFns = {
    bigint: function(val) {
        return (typeof val === "undefined" ? "undefined" : _type_of(val)) === "bigint";
    },
    function: function(val) {
        return typeof val === "function";
    },
    boolean: function(val) {
        return typeof val === "boolean";
    },
    string: function(val) {
        return typeof val === "string";
    },
    isSafeInteger: function(val) {
        return Number.isSafeInteger(val);
    },
    array: function(val) {
        return Array.isArray(val);
    },
    field: function(val, object) {
        return object.Fp.isValid(val);
    },
    hash: function(val) {
        return typeof val === "function" && Number.isSafeInteger(val.outputLen);
    }
};
function validateObject(object, validators) {
    var optValidators = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    var checkField = function(fieldName, type, isOptional) {
        var checkVal = validatorFns[type];
        if (typeof checkVal !== "function") throw new Error('Invalid validator "'.concat(type, '", expected function'));
        var val = object[fieldName];
        if (isOptional && val === void 0) return;
        if (!checkVal(val, object)) {
            throw new Error("Invalid param ".concat(String(fieldName), "=").concat(val, " (").concat(typeof val === "undefined" ? "undefined" : _type_of(val), "), expected ").concat(type));
        }
    };
    var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
    try {
        for(var _iterator = Object.entries(validators)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
            var _step_value = _sliced_to_array(_step.value, 2), fieldName = _step_value[0], type = _step_value[1];
            checkField(fieldName, type, false);
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally{
        try {
            if (!_iteratorNormalCompletion && _iterator.return != null) {
                _iterator.return();
            }
        } finally{
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }
    var _iteratorNormalCompletion1 = true, _didIteratorError1 = false, _iteratorError1 = undefined;
    try {
        for(var _iterator1 = Object.entries(optValidators)[Symbol.iterator](), _step1; !(_iteratorNormalCompletion1 = (_step1 = _iterator1.next()).done); _iteratorNormalCompletion1 = true){
            var _step_value1 = _sliced_to_array(_step1.value, 2), fieldName1 = _step_value1[0], type1 = _step_value1[1];
            checkField(fieldName1, type1, true);
        }
    } catch (err) {
        _didIteratorError1 = true;
        _iteratorError1 = err;
    } finally{
        try {
            if (!_iteratorNormalCompletion1 && _iterator1.return != null) {
                _iterator1.return();
            }
        } finally{
            if (_didIteratorError1) {
                throw _iteratorError1;
            }
        }
    }
    return object;
}
// src/sm2/bn.ts
var ZERO = BigInt(0);
var ONE = BigInt(1);
var TWO = BigInt(2);
var THREE = BigInt(3);
// src/sm2/asn1.ts
function bigintToValue(bigint) {
    var h = bigint.toString(16);
    if (h[0] !== "-") {
        if (h.length % 2 === 1) h = "0" + h;
        else if (!h.match(/^[0-7]/)) h = "00" + h;
    } else {
        h = h.substring(1);
        var len = h.length;
        if (len % 2 === 1) len += 1;
        else if (!h.match(/^[0-7]/)) len += 2;
        var maskString = "";
        for(var i = 0; i < len; i++)maskString += "f";
        var mask = hexToNumber(maskString);
        var output2 = (mask ^ bigint) + ONE;
        h = output2.toString(16).replace(/^-/, "");
    }
    return h;
}
var ASN1Object = /*#__PURE__*/ function() {
    function ASN1Object() {
        var tlv = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : null, t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "00", l = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : "00", v = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : "";
        _class_call_check(this, ASN1Object);
        this.tlv = tlv;
        this.t = t;
        this.l = l;
        this.v = v;
    }
    _create_class(ASN1Object, [
        {
            /**
   * 获取 der 编码比特流16进制串
   */ key: "getEncodedHex",
            value: function getEncodedHex() {
                if (!this.tlv) {
                    this.v = this.getValue();
                    this.l = this.getLength();
                    this.tlv = this.t + this.l + this.v;
                }
                return this.tlv;
            }
        },
        {
            key: "getLength",
            value: function getLength() {
                var n = this.v.length / 2;
                var nHex = n.toString(16);
                if (nHex.length % 2 === 1) nHex = "0" + nHex;
                if (n < 128) {
                    return nHex;
                } else {
                    var head = 128 + nHex.length / 2;
                    return head.toString(16) + nHex;
                }
            }
        },
        {
            key: "getValue",
            value: function getValue() {
                return "";
            }
        }
    ]);
    return ASN1Object;
}();
var DERInteger = /*#__PURE__*/ function(ASN1Object) {
    _inherits(DERInteger, ASN1Object);
    var _super = _create_super(DERInteger);
    function DERInteger(bigint) {
        _class_call_check(this, DERInteger);
        var _this;
        _this = _super.call(this);
        _this.t = "02";
        if (bigint) _this.v = bigintToValue(bigint);
        return _this;
    }
    _create_class(DERInteger, [
        {
            key: "getValue",
            value: function getValue() {
                return this.v;
            }
        }
    ]);
    return DERInteger;
}(ASN1Object);
var DEROctetString = /*#__PURE__*/ function(ASN1Object) {
    _inherits(DEROctetString, ASN1Object);
    var _super = _create_super(DEROctetString);
    function DEROctetString(s) {
        _class_call_check(this, DEROctetString);
        var _this;
        _this = _super.call(this);
        _this.s = s;
        __publicField(_assert_this_initialized(_this), "hV", "");
        _this.t = "04";
        if (s) _this.v = s.toLowerCase();
        return _this;
    }
    _create_class(DEROctetString, [
        {
            key: "getValue",
            value: function getValue() {
                return this.v;
            }
        }
    ]);
    return DEROctetString;
}(ASN1Object);
var DERSequence = /*#__PURE__*/ function(ASN1Object) {
    _inherits(DERSequence, ASN1Object);
    var _super = _create_super(DERSequence);
    function DERSequence(asn1Array) {
        _class_call_check(this, DERSequence);
        var _this;
        _this = _super.call(this);
        _this.asn1Array = asn1Array;
        __publicField(_assert_this_initialized(_this), "t", "30");
        return _this;
    }
    _create_class(DERSequence, [
        {
            key: "getValue",
            value: function getValue() {
                this.v = this.asn1Array.map(function(asn1Object) {
                    return asn1Object.getEncodedHex();
                }).join("");
                return this.v;
            }
        }
    ]);
    return DERSequence;
}(ASN1Object);
function getLenOfL(str, start) {
    if (+str[start + 2] < 8) return 1;
    var encoded = str.slice(start + 2, start + 6);
    var headHex = encoded.slice(0, 2);
    var head = parseInt(headHex, 16);
    var nHexLength = 1 + (head - 128);
    return nHexLength;
}
function getL(str, start) {
    var len = getLenOfL(str, start);
    var l = str.substring(start + 2, start + 2 + len * 2);
    if (!l) return -1;
    var bigint = +l[0] < 8 ? hexToNumber(l) : hexToNumber(l.substring(2));
    return +bigint.toString();
}
function getStartOfV(str, start) {
    var len = getLenOfL(str, start);
    return start + (len + 1) * 2;
}
function encodeDer(r, s) {
    var derR = new DERInteger(r);
    var derS = new DERInteger(s);
    var derSeq = new DERSequence([
        derR,
        derS
    ]);
    return derSeq.getEncodedHex();
}
function encodeEnc(x2, y, hash2, cipher) {
    var derX = new DERInteger(x2);
    var derY = new DERInteger(y);
    var derHash = new DEROctetString(hash2);
    var derCipher = new DEROctetString(cipher);
    var derSeq = new DERSequence([
        derX,
        derY,
        derHash,
        derCipher
    ]);
    return derSeq.getEncodedHex();
}
function decodeDer(input) {
    var start = getStartOfV(input, 0);
    var vIndexR = getStartOfV(input, start);
    var lR = getL(input, start);
    var vR = input.substring(vIndexR, vIndexR + lR * 2);
    var nextStart = vIndexR + vR.length;
    var vIndexS = getStartOfV(input, nextStart);
    var lS = getL(input, nextStart);
    var vS = input.substring(vIndexS, vIndexS + lS * 2);
    var r = hexToNumber(vR);
    var s = hexToNumber(vS);
    return {
        r: r,
        s: s
    };
}
function decodeEnc(input) {
    var extractSequence = function extractSequence(input2, start2) {
        var vIndex = getStartOfV(input2, start2);
        var length = getL(input2, start2);
        var value = input2.substring(vIndex, vIndex + length * 2);
        var nextStart = vIndex + value.length;
        return {
            value: value,
            nextStart: nextStart
        };
    };
    var start = getStartOfV(input, 0);
    var _extractSequence = extractSequence(input, start), vR = _extractSequence.value, startS = _extractSequence.nextStart;
    var _extractSequence1 = extractSequence(input, startS), vS = _extractSequence1.value, startHash = _extractSequence1.nextStart;
    var _extractSequence2 = extractSequence(input, startHash), hash2 = _extractSequence2.value, startCipher = _extractSequence2.nextStart;
    var _extractSequence3 = extractSequence(input, startCipher), cipher = _extractSequence3.value;
    var x2 = hexToNumber(vR);
    var y = hexToNumber(vS);
    return {
        x: x2,
        y: y,
        hash: hash2,
        cipher: cipher
    };
}
// node_modules/.pnpm/@noble+curves@1.1.0/node_modules/@noble/curves/esm/abstract/modular.js
var _0n2 = BigInt(0);
var _1n2 = BigInt(1);
var _2n2 = BigInt(2);
var _3n = BigInt(3);
var _4n = BigInt(4);
var _5n = BigInt(5);
var _8n = BigInt(8);
var _9n = BigInt(9);
var _16n = BigInt(16);
function mod(a, b) {
    var result = a % b;
    return result >= _0n2 ? result : b + result;
}
function pow(num, power, modulo) {
    if (modulo <= _0n2 || power < _0n2) throw new Error("Expected power/modulo > 0");
    if (modulo === _1n2) return _0n2;
    var res = _1n2;
    while(power > _0n2){
        if (power & _1n2) res = res * num % modulo;
        num = num * num % modulo;
        power >>= _1n2;
    }
    return res;
}
function invert(number2, modulo) {
    if (number2 === _0n2 || modulo <= _0n2) {
        throw new Error("invert: expected positive integers, got n=".concat(number2, " mod=").concat(modulo));
    }
    var a = mod(number2, modulo);
    var b = modulo;
    var x2 = _0n2, y = _1n2, u = _1n2, v = _0n2;
    while(a !== _0n2){
        var q = b / a;
        var r = b % a;
        var m = x2 - u * q;
        var n = y - v * q;
        b = a, a = r, x2 = u, y = v, u = m, v = n;
    }
    var gcd = b;
    if (gcd !== _1n2) throw new Error("invert: does not exist");
    return mod(x2, modulo);
}
function tonelliShanks(P) {
    var legendreC = (P - _1n2) / _2n2;
    var Q, S, Z;
    for(Q = P - _1n2, S = 0; Q % _2n2 === _0n2; Q /= _2n2, S++);
    for(Z = _2n2; Z < P && pow(Z, legendreC, P) !== P - _1n2; Z++);
    if (S === 1) {
        var p1div4 = (P + _1n2) / _4n;
        return function tonelliFast(Fp, n) {
            var root = Fp.pow(n, p1div4);
            if (!Fp.eql(Fp.sqr(root), n)) throw new Error("Cannot find square root");
            return root;
        };
    }
    var Q1div2 = (Q + _1n2) / _2n2;
    return function tonelliSlow(Fp, n) {
        if (Fp.pow(n, legendreC) === Fp.neg(Fp.ONE)) throw new Error("Cannot find square root");
        var r = S;
        var g = Fp.pow(Fp.mul(Fp.ONE, Z), Q);
        var x2 = Fp.pow(n, Q1div2);
        var b = Fp.pow(n, Q);
        while(!Fp.eql(b, Fp.ONE)){
            if (Fp.eql(b, Fp.ZERO)) return Fp.ZERO;
            var m = 1;
            for(var t2 = Fp.sqr(b); m < r; m++){
                if (Fp.eql(t2, Fp.ONE)) break;
                t2 = Fp.sqr(t2);
            }
            var ge = Fp.pow(g, _1n2 << BigInt(r - m - 1));
            g = Fp.sqr(ge);
            x2 = Fp.mul(x2, ge);
            b = Fp.mul(b, g);
            r = m;
        }
        return x2;
    };
}
function FpSqrt(P) {
    if (P % _4n === _3n) {
        var p1div4 = (P + _1n2) / _4n;
        return function sqrt3mod4(Fp, n) {
            var root = Fp.pow(n, p1div4);
            if (!Fp.eql(Fp.sqr(root), n)) throw new Error("Cannot find square root");
            return root;
        };
    }
    if (P % _8n === _5n) {
        var c1 = (P - _5n) / _8n;
        return function sqrt5mod8(Fp, n) {
            var n2 = Fp.mul(n, _2n2);
            var v = Fp.pow(n2, c1);
            var nv = Fp.mul(n, v);
            var i = Fp.mul(Fp.mul(nv, _2n2), v);
            var root = Fp.mul(nv, Fp.sub(i, Fp.ONE));
            if (!Fp.eql(Fp.sqr(root), n)) throw new Error("Cannot find square root");
            return root;
        };
    }
    if (P % _16n === _9n) {}
    return tonelliShanks(P);
}
var FIELD_FIELDS = [
    "create",
    "isValid",
    "is0",
    "neg",
    "inv",
    "sqrt",
    "sqr",
    "eql",
    "add",
    "sub",
    "mul",
    "pow",
    "div",
    "addN",
    "subN",
    "mulN",
    "sqrN"
];
function validateField(field2) {
    var initial = {
        ORDER: "bigint",
        MASK: "bigint",
        BYTES: "isSafeInteger",
        BITS: "isSafeInteger"
    };
    var opts = FIELD_FIELDS.reduce(function(map, val) {
        map[val] = "function";
        return map;
    }, initial);
    return validateObject(field2, opts);
}
function FpPow(f, num, power) {
    if (power < _0n2) throw new Error("Expected power > 0");
    if (power === _0n2) return f.ONE;
    if (power === _1n2) return num;
    var p = f.ONE;
    var d = num;
    while(power > _0n2){
        if (power & _1n2) p = f.mul(p, d);
        d = f.sqr(d);
        power >>= _1n2;
    }
    return p;
}
function FpInvertBatch(f, nums) {
    var tmp2 = new Array(nums.length);
    var lastMultiplied = nums.reduce(function(acc, num, i) {
        if (f.is0(num)) return acc;
        tmp2[i] = acc;
        return f.mul(acc, num);
    }, f.ONE);
    var inverted = f.inv(lastMultiplied);
    nums.reduceRight(function(acc, num, i) {
        if (f.is0(num)) return acc;
        tmp2[i] = f.mul(acc, tmp2[i]);
        return f.mul(acc, num);
    }, inverted);
    return tmp2;
}
function nLength(n, nBitLength) {
    var _nBitLength = nBitLength !== void 0 ? nBitLength : n.toString(2).length;
    var nByteLength = Math.ceil(_nBitLength / 8);
    return {
        nBitLength: _nBitLength,
        nByteLength: nByteLength
    };
}
function Field(ORDER, bitLen2) {
    var isLE4 = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false, redef = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
    if (ORDER <= _0n2) throw new Error("Expected Fp ORDER > 0, got ".concat(ORDER));
    var _nLength = nLength(ORDER, bitLen2), BITS = _nLength.nBitLength, BYTES = _nLength.nByteLength;
    if (BYTES > 2048) throw new Error("Field lengths over 2048 bytes are not supported");
    var sqrtP = FpSqrt(ORDER);
    var f = Object.freeze({
        ORDER: ORDER,
        BITS: BITS,
        BYTES: BYTES,
        MASK: bitMask(BITS),
        ZERO: _0n2,
        ONE: _1n2,
        create: function(num) {
            return mod(num, ORDER);
        },
        isValid: function(num) {
            if ((typeof num === "undefined" ? "undefined" : _type_of(num)) !== "bigint") throw new Error("Invalid field element: expected bigint, got ".concat(typeof num === "undefined" ? "undefined" : _type_of(num)));
            return _0n2 <= num && num < ORDER;
        },
        is0: function(num) {
            return num === _0n2;
        },
        isOdd: function(num) {
            return (num & _1n2) === _1n2;
        },
        neg: function(num) {
            return mod(-num, ORDER);
        },
        eql: function(lhs, rhs) {
            return lhs === rhs;
        },
        sqr: function(num) {
            return mod(num * num, ORDER);
        },
        add: function(lhs, rhs) {
            return mod(lhs + rhs, ORDER);
        },
        sub: function(lhs, rhs) {
            return mod(lhs - rhs, ORDER);
        },
        mul: function(lhs, rhs) {
            return mod(lhs * rhs, ORDER);
        },
        pow: function(num, power) {
            return FpPow(f, num, power);
        },
        div: function(lhs, rhs) {
            return mod(lhs * invert(rhs, ORDER), ORDER);
        },
        // Same as above, but doesn't normalize
        sqrN: function(num) {
            return num * num;
        },
        addN: function(lhs, rhs) {
            return lhs + rhs;
        },
        subN: function(lhs, rhs) {
            return lhs - rhs;
        },
        mulN: function(lhs, rhs) {
            return lhs * rhs;
        },
        inv: function(num) {
            return invert(num, ORDER);
        },
        sqrt: redef.sqrt || function(n) {
            return sqrtP(f, n);
        },
        invertBatch: function(lst) {
            return FpInvertBatch(f, lst);
        },
        // TODO: do we really need constant cmov?
        // We don't have const-time bigints anyway, so probably will be not very useful
        cmov: function(a, b, c) {
            return c ? b : a;
        },
        toBytes: function(num) {
            return isLE4 ? numberToBytesLE(num, BYTES) : numberToBytesBE(num, BYTES);
        },
        fromBytes: function(bytes2) {
            if (bytes2.length !== BYTES) throw new Error("Fp.fromBytes: expected ".concat(BYTES, ", got ").concat(bytes2.length));
            return isLE4 ? bytesToNumberLE(bytes2) : bytesToNumberBE(bytes2);
        }
    });
    return Object.freeze(f);
}
function hashToPrivateScalar(hash2, groupOrder) {
    var isLE4 = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false;
    hash2 = ensureBytes("privateHash", hash2);
    var hashLen = hash2.length;
    var minLen = nLength(groupOrder).nByteLength + 8;
    if (minLen < 24 || hashLen < minLen || hashLen > 1024) throw new Error("hashToPrivateScalar: expected ".concat(minLen, "-1024 bytes of input, got ").concat(hashLen));
    var num = isLE4 ? bytesToNumberLE(hash2) : bytesToNumberBE(hash2);
    return mod(num, groupOrder - _1n2) + _1n2;
}
// node_modules/.pnpm/@noble+curves@1.1.0/node_modules/@noble/curves/esm/abstract/curve.js
var _0n3 = BigInt(0);
var _1n3 = BigInt(1);
function wNAF(c, bits) {
    var constTimeNegate = function(condition, item) {
        var neg = item.negate();
        return condition ? neg : item;
    };
    var opts = function(W) {
        var windows = Math.ceil(bits / W) + 1;
        var windowSize = Math.pow(2, W - 1);
        return {
            windows: windows,
            windowSize: windowSize
        };
    };
    return {
        constTimeNegate: constTimeNegate,
        // non-const time multiplication ladder
        unsafeLadder: function unsafeLadder(elm, n) {
            var p = c.ZERO;
            var d = elm;
            while(n > _0n3){
                if (n & _1n3) p = p.add(d);
                d = d.double();
                n >>= _1n3;
            }
            return p;
        },
        /**
     * Creates a wNAF precomputation window. Used for caching.
     * Default window size is set by `utils.precompute()` and is equal to 8.
     * Number of precomputed points depends on the curve size:
     * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
     * - 𝑊 is the window size
     * - 𝑛 is the bitlength of the curve order.
     * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
     * @returns precomputed point tables flattened to a single array
     */ precomputeWindow: function precomputeWindow(elm, W) {
            var _opts = opts(W), windows = _opts.windows, windowSize = _opts.windowSize;
            var points = [];
            var p = elm;
            var base = p;
            for(var window = 0; window < windows; window++){
                base = p;
                points.push(base);
                for(var i = 1; i < windowSize; i++){
                    base = base.add(p);
                    points.push(base);
                }
                p = base.double();
            }
            return points;
        },
        /**
     * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
     * @param W window size
     * @param precomputes precomputed tables
     * @param n scalar (we don't check here, but should be less than curve order)
     * @returns real and fake (for const-time) points
     */ wNAF: function wNAF(W, precomputes, n) {
            var _opts = opts(W), windows = _opts.windows, windowSize = _opts.windowSize;
            var p = c.ZERO;
            var f = c.BASE;
            var mask = BigInt(Math.pow(2, W) - 1);
            var maxNumber = Math.pow(2, W);
            var shiftBy = BigInt(W);
            for(var window = 0; window < windows; window++){
                var offset = window * windowSize;
                var wbits = Number(n & mask);
                n >>= shiftBy;
                if (wbits > windowSize) {
                    wbits -= maxNumber;
                    n += _1n3;
                }
                var offset1 = offset;
                var offset2 = offset + Math.abs(wbits) - 1;
                var cond1 = window % 2 !== 0;
                var cond2 = wbits < 0;
                if (wbits === 0) {
                    f = f.add(constTimeNegate(cond1, precomputes[offset1]));
                } else {
                    p = p.add(constTimeNegate(cond2, precomputes[offset2]));
                }
            }
            return {
                p: p,
                f: f
            };
        },
        wNAFCached: function wNAFCached(P, precomputesMap, n, transform) {
            var W = P._WINDOW_SIZE || 1;
            var comp = precomputesMap.get(P);
            if (!comp) {
                comp = this.precomputeWindow(P, W);
                if (W !== 1) {
                    precomputesMap.set(P, transform(comp));
                }
            }
            return this.wNAF(W, comp, n);
        }
    };
}
function validateBasic(curve) {
    validateField(curve.Fp);
    validateObject(curve, {
        n: "bigint",
        h: "bigint",
        Gx: "field",
        Gy: "field"
    }, {
        nBitLength: "isSafeInteger",
        nByteLength: "isSafeInteger"
    });
    return Object.freeze(_object_spread({}, nLength(curve.n, curve.nBitLength), curve, {
        p: curve.Fp.ORDER
    }));
}
// node_modules/.pnpm/@noble+curves@1.1.0/node_modules/@noble/curves/esm/abstract/weierstrass.js
function validatePointOpts(curve) {
    var opts = validateBasic(curve);
    validateObject(opts, {
        a: "field",
        b: "field"
    }, {
        allowedPrivateKeyLengths: "array",
        wrapPrivateKey: "boolean",
        isTorsionFree: "function",
        clearCofactor: "function",
        allowInfinityPoint: "boolean",
        fromBytes: "function",
        toBytes: "function"
    });
    var endo = opts.endo, Fp = opts.Fp, a = opts.a;
    if (endo) {
        if (!Fp.eql(a, Fp.ZERO)) {
            throw new Error("Endomorphism can only be defined for Koblitz curves that have a=0");
        }
        if (typeof endo !== "object" || _type_of(endo.beta) !== "bigint" || typeof endo.splitScalar !== "function") {
            throw new Error("Expected endomorphism with beta: bigint and splitScalar: function");
        }
    }
    return Object.freeze(_object_spread({}, opts));
}
var b2n = utils_exports.bytesToNumberBE, h2b = utils_exports.hexToBytes;
var DER = {
    // asn.1 DER encoding utils
    Err: /*#__PURE__*/ function(Error1) {
        _inherits(DERErr, Error1);
        var _super = _create_super(DERErr);
        function DERErr() {
            var m = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "";
            _class_call_check(this, DERErr);
            return _super.call(this, m);
        }
        return DERErr;
    }(_wrap_native_super(Error)),
    _parseInt: function _parseInt(data) {
        var E = DER.Err;
        if (data.length < 2 || data[0] !== 2) throw new E("Invalid signature integer tag");
        var len = data[1];
        var res = data.subarray(2, len + 2);
        if (!len || res.length !== len) throw new E("Invalid signature integer: wrong length");
        if (res[0] & 128) throw new E("Invalid signature integer: negative");
        if (res[0] === 0 && !(res[1] & 128)) throw new E("Invalid signature integer: unnecessary leading zero");
        return {
            d: b2n(res),
            l: data.subarray(len + 2)
        };
    },
    toSig: function toSig(hex) {
        var E = DER.Err;
        var data = typeof hex === "string" ? h2b(hex) : hex;
        if (!_instanceof(data, Uint8Array)) throw new Error("ui8a expected");
        var l = data.length;
        if (l < 2 || data[0] != 48) throw new E("Invalid signature tag");
        if (data[1] !== l - 2) throw new E("Invalid signature: incorrect length");
        var _DER__parseInt = DER._parseInt(data.subarray(2)), r = _DER__parseInt.d, sBytes = _DER__parseInt.l;
        var _DER__parseInt1 = DER._parseInt(sBytes), s = _DER__parseInt1.d, rBytesLeft = _DER__parseInt1.l;
        if (rBytesLeft.length) throw new E("Invalid signature: left bytes after parsing");
        return {
            r: r,
            s: s
        };
    },
    hexFromSig: function hexFromSig(sig) {
        var slice = function(s2) {
            return Number.parseInt(s2[0], 16) & 8 ? "00" + s2 : s2;
        };
        var h = function(num) {
            var hex = num.toString(16);
            return hex.length & 1 ? "0".concat(hex) : hex;
        };
        var s = slice(h(sig.s));
        var r = slice(h(sig.r));
        var shl = s.length / 2;
        var rhl = r.length / 2;
        var sl = h(shl);
        var rl = h(rhl);
        return "30".concat(h(rhl + shl + 4), "02").concat(rl).concat(r, "02").concat(sl).concat(s);
    }
};
var _0n4 = BigInt(0);
var _1n4 = BigInt(1);
var _2n3 = BigInt(2);
var _3n2 = BigInt(3);
var _4n2 = BigInt(4);
function weierstrassPoints(opts) {
    var weierstrassEquation = function weierstrassEquation(x2) {
        var a = CURVE.a, b = CURVE.b;
        var x22 = Fp.sqr(x2);
        var x3 = Fp.mul(x22, x2);
        return Fp.add(Fp.add(x3, Fp.mul(x2, a)), b);
    };
    var isWithinCurveOrder = function isWithinCurveOrder(num) {
        return (typeof num === "undefined" ? "undefined" : _type_of(num)) === "bigint" && _0n4 < num && num < CURVE.n;
    };
    var assertGE = function assertGE(num) {
        if (!isWithinCurveOrder(num)) throw new Error("Expected valid bigint: 0 < bigint < curve.n");
    };
    var normPrivateKeyToScalar = function normPrivateKeyToScalar(key) {
        var lengths = CURVE.allowedPrivateKeyLengths, nByteLength = CURVE.nByteLength, wrapPrivateKey = CURVE.wrapPrivateKey, n = CURVE.n;
        if (lengths && (typeof key === "undefined" ? "undefined" : _type_of(key)) !== "bigint") {
            if (_instanceof(key, Uint8Array)) key = bytesToHex(key);
            if (typeof key !== "string" || !lengths.includes(key.length)) throw new Error("Invalid key");
            key = key.padStart(nByteLength * 2, "0");
        }
        var num;
        try {
            num = (typeof key === "undefined" ? "undefined" : _type_of(key)) === "bigint" ? key : bytesToNumberBE(ensureBytes("private key", key, nByteLength));
        } catch (error) {
            throw new Error("private key must be ".concat(nByteLength, " bytes, hex or bigint, not ").concat(typeof key === "undefined" ? "undefined" : _type_of(key)));
        }
        if (wrapPrivateKey) num = mod(num, n);
        assertGE(num);
        return num;
    };
    var assertPrjPoint = function assertPrjPoint(other) {
        if (!_instanceof(other, Point)) throw new Error("ProjectivePoint expected");
    };
    var CURVE = validatePointOpts(opts);
    var Fp = CURVE.Fp;
    var toBytes4 = CURVE.toBytes || function(c, point, isCompressed) {
        var a = point.toAffine();
        return concatBytes(Uint8Array.from([
            4
        ]), Fp.toBytes(a.x), Fp.toBytes(a.y));
    };
    var fromBytes = CURVE.fromBytes || function(bytes2) {
        var tail = bytes2.subarray(1);
        var x2 = Fp.fromBytes(tail.subarray(0, Fp.BYTES));
        var y = Fp.fromBytes(tail.subarray(Fp.BYTES, 2 * Fp.BYTES));
        return {
            x: x2,
            y: y
        };
    };
    if (!Fp.eql(Fp.sqr(CURVE.Gy), weierstrassEquation(CURVE.Gx))) throw new Error("bad generator point: equation left != right");
    var pointPrecomputes = /* @__PURE__ */ new Map();
    var Point = /*#__PURE__*/ function() {
        function Point(px, py, pz) {
            _class_call_check(this, Point);
            this.px = px;
            this.py = py;
            this.pz = pz;
            if (px == null || !Fp.isValid(px)) throw new Error("x required");
            if (py == null || !Fp.isValid(py)) throw new Error("y required");
            if (pz == null || !Fp.isValid(pz)) throw new Error("z required");
        }
        _create_class(Point, [
            {
                key: "x",
                get: function get() {
                    return this.toAffine().x;
                }
            },
            {
                key: "y",
                get: function get() {
                    return this.toAffine().y;
                }
            },
            {
                // "Private method", don't use it directly
                key: "_setWindowSize",
                value: function _setWindowSize(windowSize) {
                    this._WINDOW_SIZE = windowSize;
                    pointPrecomputes.delete(this);
                }
            },
            {
                // A point on curve is valid if it conforms to equation.
                key: "assertValidity",
                value: function assertValidity() {
                    if (this.is0()) {
                        if (CURVE.allowInfinityPoint) return;
                        throw new Error("bad point: ZERO");
                    }
                    var _this_toAffine = this.toAffine(), x2 = _this_toAffine.x, y = _this_toAffine.y;
                    if (!Fp.isValid(x2) || !Fp.isValid(y)) throw new Error("bad point: x or y not FE");
                    var left = Fp.sqr(y);
                    var right = weierstrassEquation(x2);
                    if (!Fp.eql(left, right)) throw new Error("bad point: equation left != right");
                    if (!this.isTorsionFree()) throw new Error("bad point: not in prime-order subgroup");
                }
            },
            {
                key: "hasEvenY",
                value: function hasEvenY() {
                    var y = this.toAffine().y;
                    if (Fp.isOdd) return !Fp.isOdd(y);
                    throw new Error("Field doesn't support isOdd");
                }
            },
            {
                /**
     * Compare one point to another.
     */ key: "equals",
                value: function equals(other) {
                    assertPrjPoint(other);
                    var _this = this, X1 = _this.px, Y1 = _this.py, Z1 = _this.pz;
                    var X2 = other.px, Y2 = other.py, Z2 = other.pz;
                    var U1 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
                    var U2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
                    return U1 && U2;
                }
            },
            {
                /**
     * Flips point to one corresponding to (x, -y) in Affine coordinates.
     */ key: "negate",
                value: function negate() {
                    return new Point(this.px, Fp.neg(this.py), this.pz);
                }
            },
            {
                // Renes-Costello-Batina exception-free doubling formula.
                // There is 30% faster Jacobian formula, but it is not complete.
                // https://eprint.iacr.org/2015/1060, algorithm 3
                // Cost: 8M + 3S + 3*a + 2*b3 + 15add.
                key: "double",
                value: function double() {
                    var a = CURVE.a, b = CURVE.b;
                    var b3 = Fp.mul(b, _3n2);
                    var _this = this, X1 = _this.px, Y1 = _this.py, Z1 = _this.pz;
                    var X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
                    var t0 = Fp.mul(X1, X1);
                    var t1 = Fp.mul(Y1, Y1);
                    var t2 = Fp.mul(Z1, Z1);
                    var t3 = Fp.mul(X1, Y1);
                    t3 = Fp.add(t3, t3);
                    Z3 = Fp.mul(X1, Z1);
                    Z3 = Fp.add(Z3, Z3);
                    X3 = Fp.mul(a, Z3);
                    Y3 = Fp.mul(b3, t2);
                    Y3 = Fp.add(X3, Y3);
                    X3 = Fp.sub(t1, Y3);
                    Y3 = Fp.add(t1, Y3);
                    Y3 = Fp.mul(X3, Y3);
                    X3 = Fp.mul(t3, X3);
                    Z3 = Fp.mul(b3, Z3);
                    t2 = Fp.mul(a, t2);
                    t3 = Fp.sub(t0, t2);
                    t3 = Fp.mul(a, t3);
                    t3 = Fp.add(t3, Z3);
                    Z3 = Fp.add(t0, t0);
                    t0 = Fp.add(Z3, t0);
                    t0 = Fp.add(t0, t2);
                    t0 = Fp.mul(t0, t3);
                    Y3 = Fp.add(Y3, t0);
                    t2 = Fp.mul(Y1, Z1);
                    t2 = Fp.add(t2, t2);
                    t0 = Fp.mul(t2, t3);
                    X3 = Fp.sub(X3, t0);
                    Z3 = Fp.mul(t2, t1);
                    Z3 = Fp.add(Z3, Z3);
                    Z3 = Fp.add(Z3, Z3);
                    return new Point(X3, Y3, Z3);
                }
            },
            {
                // Renes-Costello-Batina exception-free addition formula.
                // There is 30% faster Jacobian formula, but it is not complete.
                // https://eprint.iacr.org/2015/1060, algorithm 1
                // Cost: 12M + 0S + 3*a + 3*b3 + 23add.
                key: "add",
                value: function add(other) {
                    assertPrjPoint(other);
                    var _this = this, X1 = _this.px, Y1 = _this.py, Z1 = _this.pz;
                    var X2 = other.px, Y2 = other.py, Z2 = other.pz;
                    var X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
                    var a = CURVE.a;
                    var b3 = Fp.mul(CURVE.b, _3n2);
                    var t0 = Fp.mul(X1, X2);
                    var t1 = Fp.mul(Y1, Y2);
                    var t2 = Fp.mul(Z1, Z2);
                    var t3 = Fp.add(X1, Y1);
                    var t4 = Fp.add(X2, Y2);
                    t3 = Fp.mul(t3, t4);
                    t4 = Fp.add(t0, t1);
                    t3 = Fp.sub(t3, t4);
                    t4 = Fp.add(X1, Z1);
                    var t5 = Fp.add(X2, Z2);
                    t4 = Fp.mul(t4, t5);
                    t5 = Fp.add(t0, t2);
                    t4 = Fp.sub(t4, t5);
                    t5 = Fp.add(Y1, Z1);
                    X3 = Fp.add(Y2, Z2);
                    t5 = Fp.mul(t5, X3);
                    X3 = Fp.add(t1, t2);
                    t5 = Fp.sub(t5, X3);
                    Z3 = Fp.mul(a, t4);
                    X3 = Fp.mul(b3, t2);
                    Z3 = Fp.add(X3, Z3);
                    X3 = Fp.sub(t1, Z3);
                    Z3 = Fp.add(t1, Z3);
                    Y3 = Fp.mul(X3, Z3);
                    t1 = Fp.add(t0, t0);
                    t1 = Fp.add(t1, t0);
                    t2 = Fp.mul(a, t2);
                    t4 = Fp.mul(b3, t4);
                    t1 = Fp.add(t1, t2);
                    t2 = Fp.sub(t0, t2);
                    t2 = Fp.mul(a, t2);
                    t4 = Fp.add(t4, t2);
                    t0 = Fp.mul(t1, t4);
                    Y3 = Fp.add(Y3, t0);
                    t0 = Fp.mul(t5, t4);
                    X3 = Fp.mul(t3, X3);
                    X3 = Fp.sub(X3, t0);
                    t0 = Fp.mul(t3, t1);
                    Z3 = Fp.mul(t5, Z3);
                    Z3 = Fp.add(Z3, t0);
                    return new Point(X3, Y3, Z3);
                }
            },
            {
                key: "subtract",
                value: function subtract(other) {
                    return this.add(other.negate());
                }
            },
            {
                key: "is0",
                value: function is0() {
                    return this.equals(Point.ZERO);
                }
            },
            {
                key: "wNAF",
                value: function wNAF(n) {
                    return wnaf.wNAFCached(this, pointPrecomputes, n, function(comp) {
                        var toInv = Fp.invertBatch(comp.map(function(p) {
                            return p.pz;
                        }));
                        return comp.map(function(p, i) {
                            return p.toAffine(toInv[i]);
                        }).map(Point.fromAffine);
                    });
                }
            },
            {
                /**
     * Non-constant-time multiplication. Uses double-and-add algorithm.
     * It's faster, but should only be used when you don't care about
     * an exposed private key e.g. sig verification, which works over *public* keys.
     */ key: "multiplyUnsafe",
                value: function multiplyUnsafe(n) {
                    var I = Point.ZERO;
                    if (n === _0n4) return I;
                    assertGE(n);
                    if (n === _1n4) return this;
                    var endo = CURVE.endo;
                    if (!endo) return wnaf.unsafeLadder(this, n);
                    var _endo_splitScalar = endo.splitScalar(n), k1neg = _endo_splitScalar.k1neg, k1 = _endo_splitScalar.k1, k2neg = _endo_splitScalar.k2neg, k2 = _endo_splitScalar.k2;
                    var k1p = I;
                    var k2p = I;
                    var d = this;
                    while(k1 > _0n4 || k2 > _0n4){
                        if (k1 & _1n4) k1p = k1p.add(d);
                        if (k2 & _1n4) k2p = k2p.add(d);
                        d = d.double();
                        k1 >>= _1n4;
                        k2 >>= _1n4;
                    }
                    if (k1neg) k1p = k1p.negate();
                    if (k2neg) k2p = k2p.negate();
                    k2p = new Point(Fp.mul(k2p.px, endo.beta), k2p.py, k2p.pz);
                    return k1p.add(k2p);
                }
            },
            {
                /**
     * Constant time multiplication.
     * Uses wNAF method. Windowed method may be 10% faster,
     * but takes 2x longer to generate and consumes 2x memory.
     * Uses precomputes when available.
     * Uses endomorphism for Koblitz curves.
     * @param scalar by which the point would be multiplied
     * @returns New point
     */ key: "multiply",
                value: function multiply(scalar) {
                    assertGE(scalar);
                    var n = scalar;
                    var point, fake;
                    var endo = CURVE.endo;
                    if (endo) {
                        var _endo_splitScalar = endo.splitScalar(n), k1neg = _endo_splitScalar.k1neg, k1 = _endo_splitScalar.k1, k2neg = _endo_splitScalar.k2neg, k2 = _endo_splitScalar.k2;
                        var _this_wNAF = this.wNAF(k1), k1p = _this_wNAF.p, f1p = _this_wNAF.f;
                        var _this_wNAF1 = this.wNAF(k2), k2p = _this_wNAF1.p, f2p = _this_wNAF1.f;
                        k1p = wnaf.constTimeNegate(k1neg, k1p);
                        k2p = wnaf.constTimeNegate(k2neg, k2p);
                        k2p = new Point(Fp.mul(k2p.px, endo.beta), k2p.py, k2p.pz);
                        point = k1p.add(k2p);
                        fake = f1p.add(f2p);
                    } else {
                        var _this_wNAF2 = this.wNAF(n), p = _this_wNAF2.p, f = _this_wNAF2.f;
                        point = p;
                        fake = f;
                    }
                    return Point.normalizeZ([
                        point,
                        fake
                    ])[0];
                }
            },
            {
                /**
     * Efficiently calculate `aP + bQ`. Unsafe, can expose private key, if used incorrectly.
     * Not using Strauss-Shamir trick: precomputation tables are faster.
     * The trick could be useful if both P and Q are not G (not in our case).
     * @returns non-zero affine point
     */ key: "multiplyAndAddUnsafe",
                value: function multiplyAndAddUnsafe(Q, a, b) {
                    var G = Point.BASE;
                    var mul = function(P, a2) {
                        return a2 === _0n4 || a2 === _1n4 || !P.equals(G) ? P.multiplyUnsafe(a2) : P.multiply(a2);
                    };
                    var sum = mul(this, a).add(mul(Q, b));
                    return sum.is0() ? void 0 : sum;
                }
            },
            {
                // Converts Projective point to affine (x, y) coordinates.
                // Can accept precomputed Z^-1 - for example, from invertBatch.
                // (x, y, z) ∋ (x=x/z, y=y/z)
                key: "toAffine",
                value: function toAffine(iz) {
                    var _this = this, x2 = _this.px, y = _this.py, z = _this.pz;
                    var is0 = this.is0();
                    if (iz == null) iz = is0 ? Fp.ONE : Fp.inv(z);
                    var ax = Fp.mul(x2, iz);
                    var ay = Fp.mul(y, iz);
                    var zz = Fp.mul(z, iz);
                    if (is0) return {
                        x: Fp.ZERO,
                        y: Fp.ZERO
                    };
                    if (!Fp.eql(zz, Fp.ONE)) throw new Error("invZ was invalid");
                    return {
                        x: ax,
                        y: ay
                    };
                }
            },
            {
                key: "isTorsionFree",
                value: function isTorsionFree() {
                    var cofactor = CURVE.h, isTorsionFree = CURVE.isTorsionFree;
                    if (cofactor === _1n4) return true;
                    if (isTorsionFree) return isTorsionFree(Point, this);
                    throw new Error("isTorsionFree() has not been declared for the elliptic curve");
                }
            },
            {
                key: "clearCofactor",
                value: function clearCofactor() {
                    var cofactor = CURVE.h, clearCofactor = CURVE.clearCofactor;
                    if (cofactor === _1n4) return this;
                    if (clearCofactor) return clearCofactor(Point, this);
                    return this.multiplyUnsafe(CURVE.h);
                }
            },
            {
                key: "toRawBytes",
                value: function toRawBytes() {
                    var isCompressed = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : true;
                    this.assertValidity();
                    return toBytes4(Point, this, isCompressed);
                }
            },
            {
                key: "toHex",
                value: function toHex() {
                    var isCompressed = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : true;
                    return bytesToHex(this.toRawBytes(isCompressed));
                }
            }
        ], [
            {
                key: "fromAffine",
                value: // Does not validate if the point is on-curve.
                // Use fromHex instead, or call assertValidity() later.
                function fromAffine(p) {
                    var _ref = p || {}, x2 = _ref.x, y = _ref.y;
                    if (!p || !Fp.isValid(x2) || !Fp.isValid(y)) throw new Error("invalid affine point");
                    if (_instanceof(p, Point)) throw new Error("projective point not allowed");
                    var is0 = function(i) {
                        return Fp.eql(i, Fp.ZERO);
                    };
                    if (is0(x2) && is0(y)) return Point.ZERO;
                    return new Point(x2, y, Fp.ONE);
                }
            },
            {
                key: "normalizeZ",
                value: /**
     * Takes a bunch of Projective Points but executes only one
     * inversion on all of them. Inversion is very slow operation,
     * so this improves performance massively.
     * Optimization: converts a list of projective points to a list of identical points with Z=1.
     */ function normalizeZ(points) {
                    var toInv = Fp.invertBatch(points.map(function(p) {
                        return p.pz;
                    }));
                    return points.map(function(p, i) {
                        return p.toAffine(toInv[i]);
                    }).map(Point.fromAffine);
                }
            },
            {
                key: "fromHex",
                value: /**
     * Converts hash string or Uint8Array to Point.
     * @param hex short/long ECDSA hex
     */ function fromHex(hex) {
                    var P = Point.fromAffine(fromBytes(ensureBytes("pointHex", hex)));
                    P.assertValidity();
                    return P;
                }
            },
            {
                key: "fromPrivateKey",
                value: // Multiplies generator point by privateKey.
                function fromPrivateKey(privateKey) {
                    return Point.BASE.multiply(normPrivateKeyToScalar(privateKey));
                }
            }
        ]);
        return Point;
    }();
    Point.BASE = new Point(CURVE.Gx, CURVE.Gy, Fp.ONE);
    Point.ZERO = new Point(Fp.ZERO, Fp.ONE, Fp.ZERO);
    var _bits = CURVE.nBitLength;
    var wnaf = wNAF(Point, CURVE.endo ? Math.ceil(_bits / 2) : _bits);
    return {
        CURVE: CURVE,
        ProjectivePoint: Point,
        normPrivateKeyToScalar: normPrivateKeyToScalar,
        weierstrassEquation: weierstrassEquation,
        isWithinCurveOrder: isWithinCurveOrder
    };
}
function validateOpts(curve) {
    var opts = validateBasic(curve);
    validateObject(opts, {
        hash: "hash",
        hmac: "function",
        randomBytes: "function"
    }, {
        bits2int: "function",
        bits2int_modN: "function",
        lowS: "boolean"
    });
    return Object.freeze(_object_spread({
        lowS: true
    }, opts));
}
function weierstrass(curveDef) {
    var isValidFieldElement = function isValidFieldElement(num) {
        return _0n4 < num && num < Fp.ORDER;
    };
    var modN = function modN(a) {
        return mod(a, CURVE_ORDER);
    };
    var invN = function invN(a) {
        return invert(a, CURVE_ORDER);
    };
    var isBiggerThanHalfOrder = function isBiggerThanHalfOrder(number2) {
        var HALF = CURVE_ORDER >> _1n4;
        return number2 > HALF;
    };
    var normalizeS = function normalizeS(s) {
        return isBiggerThanHalfOrder(s) ? modN(-s) : s;
    };
    var getPublicKey = function getPublicKey(privateKey) {
        var isCompressed = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
        return Point.fromPrivateKey(privateKey).toRawBytes(isCompressed);
    };
    var isProbPub = function isProbPub(item) {
        var arr = _instanceof(item, Uint8Array);
        var str = typeof item === "string";
        var len = (arr || str) && item.length;
        if (arr) return len === compressedLen || len === uncompressedLen;
        if (str) return len === 2 * compressedLen || len === 2 * uncompressedLen;
        if (_instanceof(item, Point)) return true;
        return false;
    };
    var getSharedSecret2 = function getSharedSecret2(privateA, publicB) {
        var isCompressed = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : true;
        if (isProbPub(privateA)) throw new Error("first arg must be private key");
        if (!isProbPub(publicB)) throw new Error("second arg must be public key");
        var b = Point.fromHex(publicB);
        return b.multiply(normPrivateKeyToScalar(privateA)).toRawBytes(isCompressed);
    };
    var int2octets = function int2octets(num) {
        if ((typeof num === "undefined" ? "undefined" : _type_of(num)) !== "bigint") throw new Error("bigint expected");
        if (!(_0n4 <= num && num < ORDER_MASK)) throw new Error("bigint expected < 2^".concat(CURVE.nBitLength));
        return numberToBytesBE(num, CURVE.nByteLength);
    };
    var prepSig = function prepSig(msgHash, privateKey) {
        var opts = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : defaultSigOpts;
        if ([
            "recovered",
            "canonical"
        ].some(function(k) {
            return k in opts;
        })) throw new Error("sign() legacy options not supported");
        var hash2 = CURVE.hash, randomBytes2 = CURVE.randomBytes;
        var lowS = opts.lowS, prehash = opts.prehash, ent = opts.extraEntropy;
        if (lowS == null) lowS = true;
        msgHash = ensureBytes("msgHash", msgHash);
        if (prehash) msgHash = ensureBytes("prehashed msgHash", hash2(msgHash));
        var h1int = bits2int_modN(msgHash);
        var d = normPrivateKeyToScalar(privateKey);
        var seedArgs = [
            int2octets(d),
            int2octets(h1int)
        ];
        if (ent != null) {
            var e = ent === true ? randomBytes2(Fp.BYTES) : ent;
            seedArgs.push(ensureBytes("extraEntropy", e, Fp.BYTES));
        }
        var seed = concatBytes.apply(void 0, _to_consumable_array(seedArgs));
        var m = h1int;
        function k2sig(kBytes) {
            var k = bits2int(kBytes);
            if (!isWithinCurveOrder(k)) return;
            var ik = invN(k);
            var q = Point.BASE.multiply(k).toAffine();
            var r = modN(q.x);
            if (r === _0n4) return;
            var s = modN(ik * modN(m + r * d));
            if (s === _0n4) return;
            var recovery = (q.x === r ? 0 : 2) | Number(q.y & _1n4);
            var normS = s;
            if (lowS && isBiggerThanHalfOrder(s)) {
                normS = normalizeS(s);
                recovery ^= 1;
            }
            return new Signature(r, normS, recovery);
        }
        return {
            seed: seed,
            k2sig: k2sig
        };
    };
    var sign = function sign(msgHash, privKey) {
        var opts = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : defaultSigOpts;
        var _prepSig = prepSig(msgHash, privKey, opts), seed = _prepSig.seed, k2sig = _prepSig.k2sig;
        var C = CURVE;
        var drbg = createHmacDrbg(C.hash.outputLen, C.nByteLength, C.hmac);
        return drbg(seed, k2sig);
    };
    var verify = function verify(signature, msgHash, publicKey) {
        var opts = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : defaultVerOpts;
        var _Point_BASE_multiplyAndAddUnsafe;
        var sg = signature;
        msgHash = ensureBytes("msgHash", msgHash);
        publicKey = ensureBytes("publicKey", publicKey);
        if ("strict" in opts) throw new Error("options.strict was renamed to lowS");
        var lowS = opts.lowS, prehash = opts.prehash;
        var _sig = void 0;
        var P;
        try {
            if (typeof sg === "string" || _instanceof(sg, Uint8Array)) {
                try {
                    _sig = Signature.fromDER(sg);
                } catch (derError) {
                    if (!_instanceof(derError, DER.Err)) throw derError;
                    _sig = Signature.fromCompact(sg);
                }
            } else if (typeof sg === "object" && _type_of(sg.r) === "bigint" && _type_of(sg.s) === "bigint") {
                var r2 = sg.r, s2 = sg.s;
                _sig = new Signature(r2, s2);
            } else {
                throw new Error("PARSE");
            }
            P = Point.fromHex(publicKey);
        } catch (error) {
            if (error.message === "PARSE") throw new Error("signature must be Signature instance, Uint8Array or hex string");
            return false;
        }
        if (lowS && _sig.hasHighS()) return false;
        if (prehash) msgHash = CURVE.hash(msgHash);
        var r = _sig.r, s = _sig.s;
        var h = bits2int_modN(msgHash);
        var is = invN(s);
        var u1 = modN(h * is);
        var u2 = modN(r * is);
        var R = (_Point_BASE_multiplyAndAddUnsafe = Point.BASE.multiplyAndAddUnsafe(P, u1, u2)) === null || _Point_BASE_multiplyAndAddUnsafe === void 0 ? void 0 : _Point_BASE_multiplyAndAddUnsafe.toAffine();
        if (!R) return false;
        var v = modN(R.x);
        return v === r;
    };
    var CURVE = validateOpts(curveDef);
    var Fp = CURVE.Fp, CURVE_ORDER = CURVE.n;
    var compressedLen = Fp.BYTES + 1;
    var uncompressedLen = 2 * Fp.BYTES + 1;
    var _weierstrassPoints = weierstrassPoints(_object_spread_props(_object_spread({}, CURVE), {
        toBytes: function toBytes(c, point, isCompressed) {
            var a = point.toAffine();
            var x2 = Fp.toBytes(a.x);
            var cat = concatBytes;
            if (isCompressed) {
                return cat(Uint8Array.from([
                    point.hasEvenY() ? 2 : 3
                ]), x2);
            } else {
                return cat(Uint8Array.from([
                    4
                ]), x2, Fp.toBytes(a.y));
            }
        },
        fromBytes: function fromBytes(bytes2) {
            var len = bytes2.length;
            var head = bytes2[0];
            var tail = bytes2.subarray(1);
            if (len === compressedLen && (head === 2 || head === 3)) {
                var x2 = bytesToNumberBE(tail);
                if (!isValidFieldElement(x2)) throw new Error("Point is not on curve");
                var y2 = weierstrassEquation(x2);
                var y = Fp.sqrt(y2);
                var isYOdd = (y & _1n4) === _1n4;
                var isHeadOdd = (head & 1) === 1;
                if (isHeadOdd !== isYOdd) y = Fp.neg(y);
                return {
                    x: x2,
                    y: y
                };
            } else if (len === uncompressedLen && head === 4) {
                var x21 = Fp.fromBytes(tail.subarray(0, Fp.BYTES));
                var y1 = Fp.fromBytes(tail.subarray(Fp.BYTES, 2 * Fp.BYTES));
                return {
                    x: x21,
                    y: y1
                };
            } else {
                throw new Error("Point of length ".concat(len, " was invalid. Expected ").concat(compressedLen, " compressed bytes or ").concat(uncompressedLen, " uncompressed bytes"));
            }
        }
    })), Point = _weierstrassPoints.ProjectivePoint, normPrivateKeyToScalar = _weierstrassPoints.normPrivateKeyToScalar, weierstrassEquation = _weierstrassPoints.weierstrassEquation, isWithinCurveOrder = _weierstrassPoints.isWithinCurveOrder;
    var numToNByteStr = function(num) {
        return bytesToHex(numberToBytesBE(num, CURVE.nByteLength));
    };
    var slcNum = function(b, from, to) {
        return bytesToNumberBE(b.slice(from, to));
    };
    var Signature = /*#__PURE__*/ function() {
        function Signature(r, s, recovery) {
            _class_call_check(this, Signature);
            this.r = r;
            this.s = s;
            this.recovery = recovery;
            this.assertValidity();
        }
        _create_class(Signature, [
            {
                key: "assertValidity",
                value: function assertValidity() {
                    if (!isWithinCurveOrder(this.r)) throw new Error("r must be 0 < r < CURVE.n");
                    if (!isWithinCurveOrder(this.s)) throw new Error("s must be 0 < s < CURVE.n");
                }
            },
            {
                key: "addRecoveryBit",
                value: function addRecoveryBit(recovery) {
                    return new Signature(this.r, this.s, recovery);
                }
            },
            {
                key: "recoverPublicKey",
                value: function recoverPublicKey(msgHash) {
                    var _this = this, r = _this.r, s = _this.s, rec = _this.recovery;
                    var h = bits2int_modN(ensureBytes("msgHash", msgHash));
                    if (rec == null || ![
                        0,
                        1,
                        2,
                        3
                    ].includes(rec)) throw new Error("recovery id invalid");
                    var radj = rec === 2 || rec === 3 ? r + CURVE.n : r;
                    if (radj >= Fp.ORDER) throw new Error("recovery id 2 or 3 invalid");
                    var prefix = (rec & 1) === 0 ? "02" : "03";
                    var R = Point.fromHex(prefix + numToNByteStr(radj));
                    var ir = invN(radj);
                    var u1 = modN(-h * ir);
                    var u2 = modN(s * ir);
                    var Q = Point.BASE.multiplyAndAddUnsafe(R, u1, u2);
                    if (!Q) throw new Error("point at infinify");
                    Q.assertValidity();
                    return Q;
                }
            },
            {
                // Signatures should be low-s, to prevent malleability.
                key: "hasHighS",
                value: function hasHighS() {
                    return isBiggerThanHalfOrder(this.s);
                }
            },
            {
                key: "normalizeS",
                value: function normalizeS() {
                    return this.hasHighS() ? new Signature(this.r, modN(-this.s), this.recovery) : this;
                }
            },
            {
                // DER-encoded
                key: "toDERRawBytes",
                value: function toDERRawBytes() {
                    return hexToBytes(this.toDERHex());
                }
            },
            {
                key: "toDERHex",
                value: function toDERHex() {
                    return DER.hexFromSig({
                        r: this.r,
                        s: this.s
                    });
                }
            },
            {
                // padded bytes of r, then padded bytes of s
                key: "toCompactRawBytes",
                value: function toCompactRawBytes() {
                    return hexToBytes(this.toCompactHex());
                }
            },
            {
                key: "toCompactHex",
                value: function toCompactHex() {
                    return numToNByteStr(this.r) + numToNByteStr(this.s);
                }
            }
        ], [
            {
                key: "fromCompact",
                value: // pair (bytes of r, bytes of s)
                function fromCompact(hex) {
                    var l = CURVE.nByteLength;
                    hex = ensureBytes("compactSignature", hex, l * 2);
                    return new Signature(slcNum(hex, 0, l), slcNum(hex, l, 2 * l));
                }
            },
            {
                key: "fromDER",
                value: // DER encoded ECDSA signature
                // https://bitcoin.stackexchange.com/questions/57644/what-are-the-parts-of-a-bitcoin-transaction-input-script
                function fromDER(hex) {
                    var _DER_toSig = DER.toSig(ensureBytes("DER", hex)), r = _DER_toSig.r, s = _DER_toSig.s;
                    return new Signature(r, s);
                }
            }
        ]);
        return Signature;
    }();
    var utils = {
        isValidPrivateKey: function isValidPrivateKey(privateKey) {
            try {
                normPrivateKeyToScalar(privateKey);
                return true;
            } catch (error) {
                return false;
            }
        },
        normPrivateKeyToScalar: normPrivateKeyToScalar,
        /**
     * Produces cryptographically secure private key from random of size (nBitLength+64)
     * as per FIPS 186 B.4.1 with modulo bias being neglible.
     */ randomPrivateKey: function() {
            var rand = CURVE.randomBytes(Fp.BYTES + 8);
            var num = hashToPrivateScalar(rand, CURVE_ORDER);
            return numberToBytesBE(num, CURVE.nByteLength);
        },
        /**
     * Creates precompute table for an arbitrary EC point. Makes point "cached".
     * Allows to massively speed-up `point.multiply(scalar)`.
     * @returns cached point
     * @example
     * const fast = utils.precompute(8, ProjectivePoint.fromHex(someonesPubKey));
     * fast.multiply(privKey); // much faster ECDH now
     */ precompute: function precompute() {
            var windowSize = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 8, point = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : Point.BASE;
            point._setWindowSize(windowSize);
            point.multiply(BigInt(3));
            return point;
        }
    };
    var bits2int = CURVE.bits2int || function(bytes2) {
        var num = bytesToNumberBE(bytes2);
        var delta = bytes2.length * 8 - CURVE.nBitLength;
        return delta > 0 ? num >> BigInt(delta) : num;
    };
    var bits2int_modN = CURVE.bits2int_modN || function(bytes2) {
        return modN(bits2int(bytes2));
    };
    var ORDER_MASK = bitMask(CURVE.nBitLength);
    var defaultSigOpts = {
        lowS: CURVE.lowS,
        prehash: false
    };
    var defaultVerOpts = {
        lowS: CURVE.lowS,
        prehash: false
    };
    Point.BASE._setWindowSize(8);
    return {
        CURVE: CURVE,
        getPublicKey: getPublicKey,
        getSharedSecret: getSharedSecret2,
        sign: sign,
        verify: verify,
        ProjectivePoint: Point,
        Signature: Signature,
        utils: utils
    };
}
// src/sm2/rng.ts
var DEFAULT_PRNG_POOL_SIZE = 16384;
var prngPool = new Uint8Array(0);
var _syncCrypto;
function initRNGPool() {
    return _initRNGPool.apply(this, arguments);
}
function _initRNGPool() {
    _initRNGPool = _async_to_generator(function() {
        var crypto2, array, error;
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    if ("crypto" in globalThis) {
                        _syncCrypto = globalThis.crypto;
                        return [
                            2
                        ];
                    }
                    if (prngPool.length > DEFAULT_PRNG_POOL_SIZE / 2) return [
                        2
                    ];
                    if (!("wx" in globalThis && "getRandomValues" in globalThis.wx)) return [
                        3,
                        2
                    ];
                    return [
                        4,
                        new Promise(function(r) {
                            wx.getRandomValues({
                                length: DEFAULT_PRNG_POOL_SIZE,
                                success: function success(res) {
                                    r(new Uint8Array(res.randomValues));
                                }
                            });
                        })
                    ];
                case 1:
                    prngPool = _state.sent();
                    return [
                        3,
                        7
                    ];
                case 2:
                    _state.trys.push([
                        2,
                        6,
                        ,
                        7
                    ]);
                    if (!globalThis.crypto) return [
                        3,
                        3
                    ];
                    _syncCrypto = globalThis.crypto;
                    return [
                        3,
                        5
                    ];
                case 3:
                    return [
                        4,
                        Promise.resolve().then(function() {
                            return __toESM(require(/* webpackIgnore: true */ "crypto"));
                        })
                    ];
                case 4:
                    crypto2 = _state.sent();
                    _syncCrypto = crypto2.webcrypto;
                    _state.label = 5;
                case 5:
                    array = new Uint8Array(DEFAULT_PRNG_POOL_SIZE);
                    _syncCrypto.getRandomValues(array);
                    prngPool = array;
                    return [
                        3,
                        7
                    ];
                case 6:
                    error = _state.sent();
                    throw new Error("no available csprng, abort.");
                case 7:
                    return [
                        2
                    ];
            }
        });
    });
    return _initRNGPool.apply(this, arguments);
}
initRNGPool();
function consumePool(length) {
    if (prngPool.length > length) {
        var prng = prngPool.slice(0, length);
        prngPool = prngPool.slice(length);
        initRNGPool();
        return prng;
    } else {
        throw new Error("random number pool is not ready or insufficient, prevent getting too long random values or too often.");
    }
}
function randomBytes() {
    var length = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0;
    var array = new Uint8Array(length);
    if (_syncCrypto) {
        return _syncCrypto.getRandomValues(array);
    } else {
        var result = consumePool(length);
        return result;
    }
}
// src/sm3/utils.ts
var u8a2 = function(a) {
    return _instanceof(a, Uint8Array);
};
var createView = function(arr) {
    return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
};
var isLE = new Uint8Array(new Uint32Array([
    287454020
]).buffer)[0] === 68;
if (!isLE) throw new Error("Non little-endian hardware is not supported");
var hexes2 = Array.from({
    length: 256
}, function(v, i) {
    return i.toString(16).padStart(2, "0");
});
function bytesToHex2(bytes2) {
    if (!u8a2(bytes2)) throw new Error("Uint8Array expected");
    var hex = "";
    for(var i = 0; i < bytes2.length; i++){
        hex += hexes2[bytes2[i]];
    }
    return hex;
}
var te = typeof TextEncoder != "undefined" && /* @__PURE__ */ new TextEncoder();
var slc = function(v, s, e) {
    if (s == null || s < 0) s = 0;
    if (e == null || e > v.length) e = v.length;
    return new Uint8Array(v.subarray(s, e));
};
function strToU8(str) {
    if (te) return te.encode(str);
    var l = str.length;
    var ar = new Uint8Array(str.length + (str.length >> 1));
    var ai = 0;
    var w = function(v) {
        ar[ai++] = v;
    };
    for(var i = 0; i < l; ++i){
        if (ai + 5 > ar.length) {
            var n = new Uint8Array(ai + 8 + (l - i << 1));
            n.set(ar);
            ar = n;
        }
        var c = str.charCodeAt(i);
        if (c < 128) w(c);
        else if (c < 2048) w(192 | c >> 6), w(128 | c & 63);
        else if (c > 55295 && c < 57344) c = 65536 + (c & 1023 << 10) | str.charCodeAt(++i) & 1023, w(240 | c >> 18), w(128 | c >> 12 & 63), w(128 | c >> 6 & 63), w(128 | c & 63);
        else w(224 | c >> 12), w(128 | c >> 6 & 63), w(128 | c & 63);
    }
    return slc(ar, 0, ai);
}
function toBytes(data) {
    if (typeof data === "string") data = strToU8(data);
    if (!u8a2(data)) throw new Error("expected Uint8Array, got ".concat(typeof data === "undefined" ? "undefined" : _type_of(data)));
    return data;
}
var Hash = /*#__PURE__*/ function() {
    function Hash() {
        _class_call_check(this, Hash);
    }
    _create_class(Hash, [
        {
            // Safe version that clones internal state
            key: "clone",
            value: function clone() {
                return this._cloneInto();
            }
        }
    ]);
    return Hash;
}();
function wrapConstructor(hashCons) {
    var hashC = function(msg) {
        return hashCons().update(toBytes(msg)).digest();
    };
    var tmp2 = hashCons();
    hashC.outputLen = tmp2.outputLen;
    hashC.blockLen = tmp2.blockLen;
    hashC.create = function() {
        return hashCons();
    };
    return hashC;
}
// src/sm2/sm3.ts
var BoolA = function(A, B, C) {
    return A & B | A & C | B & C;
};
var BoolB = function(A, B, C) {
    return A ^ B ^ C;
};
var BoolC = function(A, B, C) {
    return A & B | ~A & C;
};
function setBigUint64(view, byteOffset, value, isLE4) {
    if (typeof view.setBigUint64 === "function") return view.setBigUint64(byteOffset, value, isLE4);
    var _32n = BigInt(32);
    var _u32_max = BigInt(4294967295);
    var wh = Number(value >> _32n & _u32_max);
    var wl = Number(value & _u32_max);
    var h = isLE4 ? 4 : 0;
    var l = isLE4 ? 0 : 4;
    view.setUint32(byteOffset + h, wh, isLE4);
    view.setUint32(byteOffset + l, wl, isLE4);
}
function rotl(x2, n) {
    var s = n & 31;
    return x2 << s | x2 >>> 32 - s;
}
function P0(X) {
    return X ^ rotl(X, 9) ^ rotl(X, 17);
}
function P1(X) {
    return X ^ rotl(X, 15) ^ rotl(X, 23);
}
var SHA2 = /*#__PURE__*/ function(Hash) {
    _inherits(SHA2, Hash);
    var _super = _create_super(SHA2);
    function SHA2(blockLen, outputLen, padOffset, isLE4) {
        _class_call_check(this, SHA2);
        var _this;
        _this = _super.call(this);
        _this.blockLen = blockLen;
        _this.outputLen = outputLen;
        _this.padOffset = padOffset;
        _this.isLE = isLE4;
        // For partial updates less than block size
        __publicField(_assert_this_initialized(_this), "buffer");
        __publicField(_assert_this_initialized(_this), "view");
        __publicField(_assert_this_initialized(_this), "finished", false);
        __publicField(_assert_this_initialized(_this), "length", 0);
        __publicField(_assert_this_initialized(_this), "pos", 0);
        __publicField(_assert_this_initialized(_this), "destroyed", false);
        _this.buffer = new Uint8Array(blockLen);
        _this.view = createView(_this.buffer);
        return _this;
    }
    _create_class(SHA2, [
        {
            key: "update",
            value: function update(data) {
                var _this = this, view = _this.view, buffer = _this.buffer, blockLen = _this.blockLen;
                data = toBytes(data);
                var len = data.length;
                for(var pos = 0; pos < len;){
                    var take = Math.min(blockLen - this.pos, len - pos);
                    if (take === blockLen) {
                        var dataView = createView(data);
                        for(; blockLen <= len - pos; pos += blockLen)this.process(dataView, pos);
                        continue;
                    }
                    buffer.set(data.subarray(pos, pos + take), this.pos);
                    this.pos += take;
                    pos += take;
                    if (this.pos === blockLen) {
                        this.process(view, 0);
                        this.pos = 0;
                    }
                }
                this.length += data.length;
                this.roundClean();
                return this;
            }
        },
        {
            key: "digestInto",
            value: function digestInto(out) {
                this.finished = true;
                var _this = this, buffer = _this.buffer, view = _this.view, blockLen = _this.blockLen, isLE4 = _this.isLE;
                var pos = this.pos;
                buffer[pos++] = 128;
                this.buffer.subarray(pos).fill(0);
                if (this.padOffset > blockLen - pos) {
                    this.process(view, 0);
                    pos = 0;
                }
                for(var i = pos; i < blockLen; i++)buffer[i] = 0;
                setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE4);
                this.process(view, 0);
                var oview = createView(out);
                var len = this.outputLen;
                if (len % 4) throw new Error("_sha2: outputLen should be aligned to 32bit");
                var outLen = len / 4;
                var state = this.get();
                if (outLen > state.length) throw new Error("_sha2: outputLen bigger than state");
                for(var i1 = 0; i1 < outLen; i1++)oview.setUint32(4 * i1, state[i1], isLE4);
            }
        },
        {
            key: "digest",
            value: function digest() {
                var _this = this, buffer = _this.buffer, outputLen = _this.outputLen;
                this.digestInto(buffer);
                var res = buffer.slice(0, outputLen);
                this.destroy();
                return res;
            }
        },
        {
            key: "_cloneInto",
            value: function _cloneInto(to) {
                var _to;
                to || (to = new this.constructor());
                (_to = to).set.apply(_to, _to_consumable_array(this.get()));
                var _this = this, blockLen = _this.blockLen, buffer = _this.buffer, length = _this.length, finished = _this.finished, destroyed = _this.destroyed, pos = _this.pos;
                to.length = length;
                to.pos = pos;
                to.finished = finished;
                to.destroyed = destroyed;
                if (length % blockLen) to.buffer.set(buffer);
                return to;
            }
        }
    ]);
    return SHA2;
}(Hash);
var IV = new Uint32Array([
    1937774191,
    1226093241,
    388252375,
    3666478592,
    2842636476,
    372324522,
    3817729613,
    2969243214
]);
var SM3_W = new Uint32Array(68);
var SM3_M = new Uint32Array(64);
var T1 = 2043430169;
var T2 = 2055708042;
var SM3 = /*#__PURE__*/ function(SHA2) {
    _inherits(SM3, SHA2);
    var _super = _create_super(SM3);
    function SM3() {
        _class_call_check(this, SM3);
        var _this;
        _this = _super.call(this, 64, 32, 8, false);
        // We cannot use array here since array allows indexing by variable
        // which means optimizer/compiler cannot use registers.
        __publicField(_assert_this_initialized(_this), "A", IV[0] | 0);
        __publicField(_assert_this_initialized(_this), "B", IV[1] | 0);
        __publicField(_assert_this_initialized(_this), "C", IV[2] | 0);
        __publicField(_assert_this_initialized(_this), "D", IV[3] | 0);
        __publicField(_assert_this_initialized(_this), "E", IV[4] | 0);
        __publicField(_assert_this_initialized(_this), "F", IV[5] | 0);
        __publicField(_assert_this_initialized(_this), "G", IV[6] | 0);
        __publicField(_assert_this_initialized(_this), "H", IV[7] | 0);
        return _this;
    }
    _create_class(SM3, [
        {
            key: "get",
            value: function get() {
                var _this = this, A = _this.A, B = _this.B, C = _this.C, D = _this.D, E = _this.E, F = _this.F, G = _this.G, H = _this.H;
                return [
                    A,
                    B,
                    C,
                    D,
                    E,
                    F,
                    G,
                    H
                ];
            }
        },
        {
            // prettier-ignore
            key: "set",
            value: function set(A, B, C, D, E, F, G, H) {
                this.A = A | 0;
                this.B = B | 0;
                this.C = C | 0;
                this.D = D | 0;
                this.E = E | 0;
                this.F = F | 0;
                this.G = G | 0;
                this.H = H | 0;
            }
        },
        {
            key: "process",
            value: function process(view, offset) {
                for(var i = 0; i < 16; i++, offset += 4)SM3_W[i] = view.getUint32(offset, false);
                for(var i1 = 16; i1 < 68; i1++){
                    SM3_W[i1] = P1(SM3_W[i1 - 16] ^ SM3_W[i1 - 9] ^ rotl(SM3_W[i1 - 3], 15)) ^ rotl(SM3_W[i1 - 13], 7) ^ SM3_W[i1 - 6];
                }
                for(var i2 = 0; i2 < 64; i2++){
                    SM3_M[i2] = SM3_W[i2] ^ SM3_W[i2 + 4];
                }
                var _this = this, A = _this.A, B = _this.B, C = _this.C, D = _this.D, E = _this.E, F = _this.F, G = _this.G, H = _this.H;
                for(var j = 0; j < 64; j++){
                    var small = j >= 0 && j <= 15;
                    var T = small ? T1 : T2;
                    var SS1 = rotl(rotl(A, 12) + E + rotl(T, j), 7);
                    var SS2 = SS1 ^ rotl(A, 12);
                    var TT1 = (small ? BoolB(A, B, C) : BoolA(A, B, C)) + D + SS2 + SM3_M[j] | 0;
                    var TT2 = (small ? BoolB(E, F, G) : BoolC(E, F, G)) + H + SS1 + SM3_W[j] | 0;
                    D = C;
                    C = rotl(B, 9);
                    B = A;
                    A = TT1;
                    H = G;
                    G = rotl(F, 19);
                    F = E;
                    E = P0(TT2);
                }
                A = A ^ this.A | 0;
                B = B ^ this.B | 0;
                C = C ^ this.C | 0;
                D = D ^ this.D | 0;
                E = E ^ this.E | 0;
                F = F ^ this.F | 0;
                G = G ^ this.G | 0;
                H = H ^ this.H | 0;
                this.set(A, B, C, D, E, F, G, H);
            }
        },
        {
            key: "roundClean",
            value: function roundClean() {
                SM3_W.fill(0);
            }
        },
        {
            key: "destroy",
            value: function destroy() {
                this.set(0, 0, 0, 0, 0, 0, 0, 0);
                this.buffer.fill(0);
            }
        }
    ]);
    return SM3;
}(SHA2);
var sm3 = wrapConstructor(function() {
    return new SM3();
});
// src/sm2/hmac.ts
var HMAC = /*#__PURE__*/ function(Hash) {
    _inherits(HMAC, Hash);
    var _super = _create_super(HMAC);
    function HMAC(hash2, _key) {
        _class_call_check(this, HMAC);
        var _this;
        _this = _super.call(this);
        __publicField(_assert_this_initialized(_this), "oHash");
        __publicField(_assert_this_initialized(_this), "iHash");
        __publicField(_assert_this_initialized(_this), "blockLen");
        __publicField(_assert_this_initialized(_this), "outputLen");
        __publicField(_assert_this_initialized(_this), "finished", false);
        __publicField(_assert_this_initialized(_this), "destroyed", false);
        var key = toBytes(_key);
        _this.iHash = hash2.create();
        if (typeof _this.iHash.update !== "function") throw new Error("Expected instance of class which extends utils.Hash");
        _this.blockLen = _this.iHash.blockLen;
        _this.outputLen = _this.iHash.outputLen;
        var blockLen = _this.blockLen;
        var pad = new Uint8Array(blockLen);
        pad.set(key.length > blockLen ? hash2.create().update(key).digest() : key);
        for(var i = 0; i < pad.length; i++)pad[i] ^= 54;
        _this.iHash.update(pad);
        _this.oHash = hash2.create();
        for(var i1 = 0; i1 < pad.length; i1++)pad[i1] ^= 54 ^ 92;
        _this.oHash.update(pad);
        pad.fill(0);
        return _this;
    }
    _create_class(HMAC, [
        {
            key: "update",
            value: function update(buf) {
                this.iHash.update(buf);
                return this;
            }
        },
        {
            key: "digestInto",
            value: function digestInto(out) {
                this.finished = true;
                this.iHash.digestInto(out);
                this.oHash.update(out);
                this.oHash.digestInto(out);
                this.destroy();
            }
        },
        {
            key: "digest",
            value: function digest() {
                var out = new Uint8Array(this.oHash.outputLen);
                this.digestInto(out);
                return out;
            }
        },
        {
            key: "_cloneInto",
            value: function _cloneInto(to) {
                to || (to = Object.create(Object.getPrototypeOf(this), {}));
                var _this = this, oHash = _this.oHash, iHash = _this.iHash, finished = _this.finished, destroyed = _this.destroyed, blockLen = _this.blockLen, outputLen = _this.outputLen;
                to = to;
                to.finished = finished;
                to.destroyed = destroyed;
                to.blockLen = blockLen;
                to.outputLen = outputLen;
                to.oHash = oHash._cloneInto(to.oHash);
                to.iHash = iHash._cloneInto(to.iHash);
                return to;
            }
        },
        {
            key: "destroy",
            value: function destroy() {
                this.destroyed = true;
                this.oHash.destroy();
                this.iHash.destroy();
            }
        }
    ]);
    return HMAC;
}(Hash);
var hmac = function(hash2, key, message) {
    return new HMAC(hash2, key).update(message).digest();
};
hmac.create = function(hash2, key) {
    return new HMAC(hash2, key);
};
// src/sm2/ec.ts
var sm2Fp = Field(BigInt("115792089210356248756420345214020892766250353991924191454421193933289684991999"));
var sm2Curve = weierstrass({
    // sm2: short weierstrass.
    a: BigInt("115792089210356248756420345214020892766250353991924191454421193933289684991996"),
    b: BigInt("18505919022281880113072981827955639221458448578012075254857346196103069175443"),
    Fp: sm2Fp,
    h: ONE,
    n: BigInt("115792089210356248756420345214020892766061623724957744567843809356293439045923"),
    Gx: BigInt("22963146547237050559479531362550074578802567295341616970375194840604139615431"),
    Gy: BigInt("85132369209828568825618990617112496413088388631904505083283536607588877201568"),
    hash: sm3,
    hmac: function(key) {
        for(var _len = arguments.length, msgs = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++){
            msgs[_key - 1] = arguments[_key];
        }
        return hmac(sm3, key, concatBytes.apply(void 0, _to_consumable_array(msgs)));
    },
    randomBytes: randomBytes
});
var field = Field(BigInt(sm2Curve.CURVE.n));
// src/sm2/utils.ts
function generateKeyPairHex(str) {
    var privateKey = str ? numberToBytesBE(mod(BigInt(str), ONE) + ONE, 32) : sm2Curve.utils.randomPrivateKey();
    var publicKey = sm2Curve.getPublicKey(privateKey, false);
    var privPad = leftPad(bytesToHex(privateKey), 64);
    var pubPad = leftPad(bytesToHex(publicKey), 64);
    return {
        privateKey: privPad,
        publicKey: pubPad
    };
}
function compressPublicKeyHex(s) {
    if (s.length !== 130) throw new Error("Invalid public key to compress");
    var len = (s.length - 2) / 2;
    var xHex = s.substring(2, 2 + len);
    var y = hexToNumber(s.substring(len + 2, len + len + 2));
    var prefix = "03";
    if (mod(y, TWO) === ZERO) prefix = "02";
    return prefix + xHex;
}
function utf8ToHex(input) {
    var bytes2 = strToU8(input);
    return bytesToHex(bytes2);
}
function leftPad(input, num) {
    if (input.length >= num) return input;
    return new Array(num - input.length + 1).join("0") + input;
}
function arrayToHex(arr) {
    return arr.map(function(item) {
        var hex = item.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join("");
}
function arrayToUtf8(arr) {
    var str = [];
    for(var i = 0, len = arr.length; i < len; i++){
        if (arr[i] >= 240 && arr[i] <= 247) {
            str.push(String.fromCodePoint(((arr[i] & 7) << 18) + ((arr[i + 1] & 63) << 12) + ((arr[i + 2] & 63) << 6) + (arr[i + 3] & 63)));
            i += 3;
        } else if (arr[i] >= 224 && arr[i] <= 239) {
            str.push(String.fromCodePoint(((arr[i] & 15) << 12) + ((arr[i + 1] & 63) << 6) + (arr[i + 2] & 63)));
            i += 2;
        } else if (arr[i] >= 192 && arr[i] <= 223) {
            str.push(String.fromCodePoint(((arr[i] & 31) << 6) + (arr[i + 1] & 63)));
            i++;
        } else {
            str.push(String.fromCodePoint(arr[i]));
        }
    }
    return str.join("");
}
function hexToArray(hexStr) {
    var hexStrLength = hexStr.length;
    if (hexStrLength % 2 !== 0) {
        hexStr = leftPad(hexStr, hexStrLength + 1);
    }
    hexStrLength = hexStr.length;
    var wordLength = hexStrLength / 2;
    var words = new Uint8Array(wordLength);
    for(var i = 0; i < wordLength; i++){
        words[i] = parseInt(hexStr.substring(i * 2, i * 2 + 2), 16);
    }
    return words;
}
function verifyPublicKey(publicKey) {
    var point = sm2Curve.ProjectivePoint.fromHex(publicKey);
    if (!point) return false;
    try {
        point.assertValidity();
        return true;
    } catch (error) {
        return false;
    }
}
function comparePublicKeyHex(publicKey1, publicKey2) {
    var point1 = sm2Curve.ProjectivePoint.fromHex(publicKey1);
    if (!point1) return false;
    var point2 = sm2Curve.ProjectivePoint.fromHex(publicKey2);
    if (!point2) return false;
    return point1.equals(point2);
}
// src/sm3/index.ts
function utf8ToArray(str) {
    var arr = [];
    for(var i = 0, len = str.length; i < len; i++){
        var point = str.codePointAt(i);
        if (point <= 127) {
            arr.push(point);
        } else if (point <= 2047) {
            arr.push(192 | point >>> 6);
            arr.push(128 | point & 63);
        } else if (point <= 55295 || point >= 57344 && point <= 65535) {
            arr.push(224 | point >>> 12);
            arr.push(128 | point >>> 6 & 63);
            arr.push(128 | point & 63);
        } else if (point >= 65536 && point <= 1114111) {
            i++;
            arr.push(240 | point >>> 18 & 28);
            arr.push(128 | point >>> 12 & 63);
            arr.push(128 | point >>> 6 & 63);
            arr.push(128 | point & 63);
        } else {
            arr.push(point);
            throw new Error("input is not supported");
        }
    }
    return new Uint8Array(arr);
}
function sm32(input, options) {
    input = typeof input === "string" ? utf8ToArray(input) : input;
    if (options) {
        var mode = options.mode || "hmac";
        if (mode !== "hmac") throw new Error("invalid mode");
        var key = options.key;
        if (!key) throw new Error("invalid key");
        key = typeof key === "string" ? hexToArray(key) : key;
        return bytesToHex2(hmac(sm3, key, input));
    }
    return bytesToHex2(sm3(input));
}
// src/sm2/kdf.ts
function kdf(z, keylen, iv) {
    z = typeof z === "string" ? utf8ToArray(z) : z;
    var IV2 = iv == null ? EmptyArray : typeof iv === "string" ? utf8ToArray(iv) : iv;
    var msg = new Uint8Array(keylen);
    var ct = 1;
    var offset = 0;
    var t = EmptyArray;
    var ctShift = new Uint8Array(4);
    var nextT = function() {
        ctShift[0] = ct >> 24 & 255;
        ctShift[1] = ct >> 16 & 255;
        ctShift[2] = ct >> 8 & 255;
        ctShift[3] = ct & 255;
        t = sm3(concatBytes(z, ctShift, IV2));
        ct++;
        offset = 0;
    };
    nextT();
    for(var i = 0, len = msg.length; i < len; i++){
        if (offset === t.length) nextT();
        msg[i] = t[offset++] & 255;
    }
    return msg;
}
// src/sm2/kx.ts
var wPow2 = hexToNumber("80000000000000000000000000000000");
var wPow2Sub1 = hexToNumber("7fffffffffffffffffffffffffffffff");
function calculateSharedKey(keypairA, ephemeralKeypairA, publicKeyB, ephemeralPublicKeyB, sharedKeyLength) {
    var isRecipient = arguments.length > 5 && arguments[5] !== void 0 ? arguments[5] : false, idA = arguments.length > 6 && arguments[6] !== void 0 ? arguments[6] : "1234567812345678", idB = arguments.length > 7 && arguments[7] !== void 0 ? arguments[7] : "1234567812345678";
    var RA = sm2Curve.ProjectivePoint.fromHex(ephemeralKeypairA.publicKey);
    var RB = sm2Curve.ProjectivePoint.fromHex(ephemeralPublicKeyB);
    var PB = sm2Curve.ProjectivePoint.fromHex(publicKeyB);
    var ZA = getZ(keypairA.publicKey, idA);
    var ZB = getZ(publicKeyB, idB);
    if (isRecipient) {
        var ref;
        ref = [
            ZB,
            ZA
        ], ZA = ref[0], ZB = ref[1], ref;
    }
    var rA = hexToNumber(ephemeralKeypairA.privateKey);
    var dA = hexToNumber(keypairA.privateKey);
    var x1 = RA.x;
    var x1_ = wPow2 + (x1 & wPow2Sub1);
    var tA = field.add(dA, field.mulN(x1_, rA));
    var x2 = RB.x;
    var x2_ = field.add(wPow2, x2 & wPow2Sub1);
    var U = RB.multiply(x2_).add(PB).multiply(tA);
    var xU = hexToArray(leftPad(numberToHexUnpadded(U.x), 64));
    var yU = hexToArray(leftPad(numberToHexUnpadded(U.y), 64));
    var KA = kdf(concatBytes(xU, yU, ZA, ZB), sharedKeyLength);
    return KA;
}
// src/sm2/index.ts
var getSharedSecret = sm2Curve.getSharedSecret;
function xorCipherStream(x2, y2, msg) {
    var stream = kdf(concatBytes(x2, y2), msg.length);
    for(var i = 0, len = msg.length; i < len; i++){
        msg[i] ^= stream[i] & 255;
    }
}
var C1C2C3 = 0;
var EmptyArray = new Uint8Array();
function doEncrypt(msg, publicKey) {
    var cipherMode = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 1, options = arguments.length > 3 ? arguments[3] : void 0;
    var msgArr = typeof msg === "string" ? hexToArray(utf8ToHex(msg)) : Uint8Array.from(msg);
    var publicKeyPoint = typeof publicKey === "string" ? sm2Curve.ProjectivePoint.fromHex(publicKey) : publicKey;
    var keypair = generateKeyPairHex();
    var k = hexToNumber(keypair.privateKey);
    var c1 = keypair.publicKey;
    if (c1.length > 128) c1 = c1.substring(c1.length - 128);
    var p = publicKeyPoint.multiply(k);
    var x2 = hexToArray(leftPad(numberToHexUnpadded(p.x), 64));
    var y2 = hexToArray(leftPad(numberToHexUnpadded(p.y), 64));
    var c3 = bytesToHex2(sm3(concatBytes(x2, msgArr, y2)));
    xorCipherStream(x2, y2, msgArr);
    var c2 = bytesToHex2(msgArr);
    if (options === null || options === void 0 ? void 0 : options.asn1) {
        var point = sm2Curve.ProjectivePoint.fromHex(keypair.publicKey);
        var encode = cipherMode === C1C2C3 ? encodeEnc(point.x, point.y, c2, c3) : encodeEnc(point.x, point.y, c3, c2);
        return encode;
    }
    return cipherMode === C1C2C3 ? c1 + c2 + c3 : c1 + c3 + c2;
}
function doDecrypt(encryptData, privateKey) {
    var cipherMode = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 1, options = arguments.length > 3 ? arguments[3] : void 0;
    var _ref = options || {}, tmp = _ref.output, output2 = tmp === void 0 ? "string" : tmp, _ref_asn1 = _ref.asn1, asn1 = _ref_asn1 === void 0 ? false : _ref_asn1;
    var privateKeyInteger = hexToNumber(privateKey);
    var c1;
    var c2;
    var c3;
    if (asn1) {
        var _decodeEnc = decodeEnc(encryptData), x3 = _decodeEnc.x, y = _decodeEnc.y, cipher = _decodeEnc.cipher, hash2 = _decodeEnc.hash;
        c1 = sm2Curve.ProjectivePoint.fromAffine({
            x: x3,
            y: y
        });
        c3 = hash2;
        c2 = cipher;
        if (cipherMode === C1C2C3) {
            var ref;
            ref = [
                c3,
                c2
            ], c2 = ref[0], c3 = ref[1], ref;
        }
    } else {
        c1 = sm2Curve.ProjectivePoint.fromHex("04" + encryptData.substring(0, 128));
        c3 = encryptData.substring(128, 128 + 64);
        c2 = encryptData.substring(128 + 64);
        if (cipherMode === C1C2C3) {
            c3 = encryptData.substring(encryptData.length - 64);
            c2 = encryptData.substring(128, encryptData.length - 64);
        }
    }
    var msg = hexToArray(c2);
    var p = c1.multiply(privateKeyInteger);
    var x2 = hexToArray(leftPad(numberToHexUnpadded(p.x), 64));
    var y2 = hexToArray(leftPad(numberToHexUnpadded(p.y), 64));
    xorCipherStream(x2, y2, msg);
    var checkC3 = arrayToHex(Array.from(sm3(concatBytes(x2, msg, y2))));
    if (checkC3 === c3.toLowerCase()) {
        return output2 === "array" ? msg : arrayToUtf8(msg);
    } else {
        return output2 === "array" ? [] : "";
    }
}
function doSignature(msg, privateKey) {
    var options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    var pointPool = options.pointPool, der = options.der, hash2 = options.hash, publicKey = options.publicKey, userId = options.userId;
    var hashHex = typeof msg === "string" ? utf8ToHex(msg) : arrayToHex(Array.from(msg));
    if (hash2) {
        publicKey = publicKey || getPublicKeyFromPrivateKey(privateKey);
        hashHex = getHash(hashHex, publicKey, userId);
    }
    var dA = hexToNumber(privateKey);
    var e = hexToNumber(hashHex);
    var k = null;
    var r = null;
    var s = null;
    do {
        do {
            var point = void 0;
            if (pointPool && pointPool.length) {
                point = pointPool.pop();
            } else {
                point = getPoint();
            }
            k = point.k;
            r = field.add(e, point.x1);
        }while (r === ZERO || r + k === sm2Curve.CURVE.n);
        s = field.mul(field.inv(field.addN(dA, ONE)), field.subN(k, field.mulN(r, dA)));
    }while (s === ZERO);
    if (der) return encodeDer(r, s);
    return leftPad(numberToHexUnpadded(r), 64) + leftPad(numberToHexUnpadded(s), 64);
}
function doVerifySignature(msg, signHex, publicKey) {
    var options = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
    var hashHex;
    var hash2 = options.hash, der = options.der, userId = options.userId;
    var publicKeyHex = typeof publicKey === "string" ? publicKey : publicKey.toHex(false);
    if (hash2) {
        hashHex = getHash(typeof msg === "string" ? utf8ToHex(msg) : msg, publicKeyHex, userId);
    } else {
        hashHex = typeof msg === "string" ? utf8ToHex(msg) : arrayToHex(Array.from(msg));
    }
    var r;
    var s;
    if (der) {
        var decodeDerObj = decodeDer(signHex);
        r = decodeDerObj.r;
        s = decodeDerObj.s;
    } else {
        r = hexToNumber(signHex.substring(0, 64));
        s = hexToNumber(signHex.substring(64));
    }
    var PA = typeof publicKey === "string" ? sm2Curve.ProjectivePoint.fromHex(publicKey) : publicKey;
    var e = hexToNumber(hashHex);
    var t = field.add(r, s);
    if (t === ZERO) return false;
    var x1y1 = sm2Curve.ProjectivePoint.BASE.multiply(s).add(PA.multiply(t));
    var R = field.add(e, x1y1.x);
    return r === R;
}
function getZ(publicKey) {
    var userId = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "1234567812345678";
    userId = utf8ToHex(userId);
    var a = leftPad(numberToHexUnpadded(sm2Curve.CURVE.a), 64);
    var b = leftPad(numberToHexUnpadded(sm2Curve.CURVE.b), 64);
    var gx = leftPad(numberToHexUnpadded(sm2Curve.ProjectivePoint.BASE.x), 64);
    var gy = leftPad(numberToHexUnpadded(sm2Curve.ProjectivePoint.BASE.y), 64);
    var px;
    var py;
    if (publicKey.length === 128) {
        px = publicKey.substring(0, 64);
        py = publicKey.substring(64, 128);
    } else {
        var point = sm2Curve.ProjectivePoint.fromHex(publicKey);
        px = leftPad(numberToHexUnpadded(point.x), 64);
        py = leftPad(numberToHexUnpadded(point.y), 64);
    }
    var data = hexToArray(userId + a + b + gx + gy + px + py);
    var entl = userId.length * 4;
    var z = sm3(concatBytes(new Uint8Array([
        entl >> 8 & 255,
        entl & 255
    ]), data));
    return z;
}
function getHash(hashHex, publicKey) {
    var userId = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : "1234567812345678";
    var z = getZ(publicKey, userId);
    return bytesToHex2(sm3(concatBytes(z, typeof hashHex === "string" ? hexToArray(hashHex) : hashHex)));
}
function precomputePublicKey(publicKey, windowSize) {
    var point = sm2Curve.ProjectivePoint.fromHex(publicKey);
    return sm2Curve.utils.precompute(windowSize, point);
}
function getPublicKeyFromPrivateKey(privateKey) {
    var pubKey = sm2Curve.getPublicKey(privateKey, false);
    var pubPad = leftPad(bytesToHex(pubKey), 64);
    return pubPad;
}
function getPoint() {
    var keypair = generateKeyPairHex();
    var PA = sm2Curve.ProjectivePoint.fromHex(keypair.publicKey);
    var k = hexToNumber(keypair.privateKey);
    return _object_spread_props(_object_spread({}, keypair), {
        k: k,
        x1: PA.x
    });
}
// node_modules/.pnpm/@noble+hashes@1.3.1/node_modules/@noble/hashes/esm/_assert.js
function number(n) {
    if (!Number.isSafeInteger(n) || n < 0) throw new Error("Wrong positive integer: ".concat(n));
}
function bool(b) {
    if (typeof b !== "boolean") throw new Error("Expected boolean, not ".concat(b));
}
function bytes(b) {
    for(var _len = arguments.length, lengths = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++){
        lengths[_key - 1] = arguments[_key];
    }
    if (!_instanceof(b, Uint8Array)) throw new Error("Expected Uint8Array");
    if (lengths.length > 0 && !lengths.includes(b.length)) throw new Error("Expected Uint8Array of length ".concat(lengths, ", not of length=").concat(b.length));
}
function hash(hash2) {
    if (typeof hash2 !== "function" || typeof hash2.create !== "function") throw new Error("Hash should be wrapped by utils.wrapConstructor");
    number(hash2.outputLen);
    number(hash2.blockLen);
}
function exists(instance) {
    var checkFinished = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
    if (instance.destroyed) throw new Error("Hash instance has been destroyed");
    if (checkFinished && instance.finished) throw new Error("Hash#digest() has already been called");
}
function output(out, instance) {
    bytes(out);
    var min = instance.outputLen;
    if (out.length < min) {
        throw new Error("digestInto() expects output buffer of length at least ".concat(min));
    }
}
var assert = {
    number: number,
    bool: bool,
    bytes: bytes,
    hash: hash,
    exists: exists,
    output: output
};
var assert_default = assert;
// node_modules/.pnpm/@noble+hashes@1.3.1/node_modules/@noble/hashes/esm/cryptoNode.js
var nc = __toESM(require("crypto"), 1);
var crypto = nc && typeof nc === "object" && "webcrypto" in nc ? nc.webcrypto : void 0;
// node_modules/.pnpm/@noble+hashes@1.3.1/node_modules/@noble/hashes/esm/utils.js
var u8a3 = function(a) {
    return _instanceof(a, Uint8Array);
};
var isLE2 = new Uint8Array(new Uint32Array([
    287454020
]).buffer)[0] === 68;
if (!isLE2) throw new Error("Non little-endian hardware is not supported");
var hexes3 = Array.from({
    length: 256
}, function(v, i) {
    return i.toString(16).padStart(2, "0");
});
function utf8ToBytes2(str) {
    if (typeof str !== "string") throw new Error("utf8ToBytes expected string, got ".concat(typeof str === "undefined" ? "undefined" : _type_of(str)));
    return new Uint8Array(new TextEncoder().encode(str));
}
function toBytes2(data) {
    if (typeof data === "string") data = utf8ToBytes2(data);
    if (!u8a3(data)) throw new Error("expected Uint8Array, got ".concat(typeof data === "undefined" ? "undefined" : _type_of(data)));
    return data;
}
var Hash2 = /*#__PURE__*/ function() {
    function Hash2() {
        _class_call_check(this, Hash2);
    }
    _create_class(Hash2, [
        {
            // Safe version that clones internal state
            key: "clone",
            value: function clone() {
                return this._cloneInto();
            }
        }
    ]);
    return Hash2;
}();
// node_modules/.pnpm/@noble+hashes@1.3.1/node_modules/@noble/hashes/esm/hmac.js
var HMAC2 = /*#__PURE__*/ function(Hash2) {
    _inherits(HMAC2, Hash2);
    var _super = _create_super(HMAC2);
    function HMAC2(hash2, _key) {
        _class_call_check(this, HMAC2);
        var _this;
        _this = _super.call(this);
        _this.finished = false;
        _this.destroyed = false;
        assert_default.hash(hash2);
        var key = toBytes2(_key);
        _this.iHash = hash2.create();
        if (typeof _this.iHash.update !== "function") throw new Error("Expected instance of class which extends utils.Hash");
        _this.blockLen = _this.iHash.blockLen;
        _this.outputLen = _this.iHash.outputLen;
        var blockLen = _this.blockLen;
        var pad = new Uint8Array(blockLen);
        pad.set(key.length > blockLen ? hash2.create().update(key).digest() : key);
        for(var i = 0; i < pad.length; i++)pad[i] ^= 54;
        _this.iHash.update(pad);
        _this.oHash = hash2.create();
        for(var i1 = 0; i1 < pad.length; i1++)pad[i1] ^= 54 ^ 92;
        _this.oHash.update(pad);
        pad.fill(0);
        return _this;
    }
    _create_class(HMAC2, [
        {
            key: "update",
            value: function update(buf) {
                assert_default.exists(this);
                this.iHash.update(buf);
                return this;
            }
        },
        {
            key: "digestInto",
            value: function digestInto(out) {
                assert_default.exists(this);
                assert_default.bytes(out, this.outputLen);
                this.finished = true;
                this.iHash.digestInto(out);
                this.oHash.update(out);
                this.oHash.digestInto(out);
                this.destroy();
            }
        },
        {
            key: "digest",
            value: function digest() {
                var out = new Uint8Array(this.oHash.outputLen);
                this.digestInto(out);
                return out;
            }
        },
        {
            key: "_cloneInto",
            value: function _cloneInto(to) {
                to || (to = Object.create(Object.getPrototypeOf(this), {}));
                var _this = this, oHash = _this.oHash, iHash = _this.iHash, finished = _this.finished, destroyed = _this.destroyed, blockLen = _this.blockLen, outputLen = _this.outputLen;
                to = to;
                to.finished = finished;
                to.destroyed = destroyed;
                to.blockLen = blockLen;
                to.outputLen = outputLen;
                to.oHash = oHash._cloneInto(to.oHash);
                to.iHash = iHash._cloneInto(to.iHash);
                return to;
            }
        },
        {
            key: "destroy",
            value: function destroy() {
                this.destroyed = true;
                this.oHash.destroy();
                this.iHash.destroy();
            }
        }
    ]);
    return HMAC2;
}(Hash2);
var hmac2 = function(hash2, key, message) {
    return new HMAC2(hash2, key).update(message).digest();
};
hmac2.create = function(hash2, key) {
    return new HMAC2(hash2, key);
};
// node_modules/.pnpm/@noble+hashes@1.3.1/node_modules/@noble/hashes/esm/hkdf.js
function extract(hash2, ikm, salt) {
    assert_default.hash(hash2);
    if (salt === void 0) salt = new Uint8Array(hash2.outputLen);
    return hmac2(hash2, toBytes2(salt), toBytes2(ikm));
}
var HKDF_COUNTER = new Uint8Array([
    0
]);
var EMPTY_BUFFER = new Uint8Array();
function expand(hash2, prk, info) {
    var length = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 32;
    assert_default.hash(hash2);
    assert_default.number(length);
    if (length > 255 * hash2.outputLen) throw new Error("Length should be <= 255*HashLen");
    var blocks = Math.ceil(length / hash2.outputLen);
    if (info === void 0) info = EMPTY_BUFFER;
    var okm = new Uint8Array(blocks * hash2.outputLen);
    var HMAC3 = hmac2.create(hash2, prk);
    var HMACTmp = HMAC3._cloneInto();
    var T = new Uint8Array(HMAC3.outputLen);
    for(var counter = 0; counter < blocks; counter++){
        HKDF_COUNTER[0] = counter + 1;
        HMACTmp.update(counter === 0 ? EMPTY_BUFFER : T).update(info).update(HKDF_COUNTER).digestInto(T);
        okm.set(T, hash2.outputLen * counter);
        HMAC3._cloneInto(HMACTmp);
    }
    HMAC3.destroy();
    HMACTmp.destroy();
    T.fill(0);
    HKDF_COUNTER.fill(0);
    return okm.slice(0, length);
}
var hkdf = function(hash2, ikm, salt, info, length) {
    return expand(hash2, extract(hash2, ikm, salt), info, length);
};
// src/sm3/hkdf.ts
function hkdf2(ikm, salt, info, length) {
    return hkdf(sm3, ikm, salt, info, length);
}
// src/sm4/index.ts
var sm4_exports = {};
__export(sm4_exports, {
    decrypt: function() {
        return decrypt;
    },
    encrypt: function() {
        return encrypt;
    },
    sm4: function() {
        return sm4;
    }
});
// node_modules/.pnpm/@noble+ciphers@1.2.1/node_modules/@noble/ciphers/esm/_assert.js
function isBytes(a) {
    return _instanceof(a, Uint8Array) || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function abytes(b) {
    for(var _len = arguments.length, lengths = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++){
        lengths[_key - 1] = arguments[_key];
    }
    if (!isBytes(b)) throw new Error("Uint8Array expected");
    if (lengths.length > 0 && !lengths.includes(b.length)) throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
}
function aexists(instance) {
    var checkFinished = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
    if (instance.destroyed) throw new Error("Hash instance has been destroyed");
    if (checkFinished && instance.finished) throw new Error("Hash#digest() has already been called");
}
function aoutput(out, instance) {
    abytes(out);
    var min = instance.outputLen;
    if (out.length < min) {
        throw new Error("digestInto() expects output buffer of length at least " + min);
    }
}
// node_modules/.pnpm/@noble+ciphers@1.2.1/node_modules/@noble/ciphers/esm/utils.js
var u32 = function(arr) {
    return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
};
var createView2 = function(arr) {
    return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
};
var isLE3 = new Uint8Array(new Uint32Array([
    287454020
]).buffer)[0] === 68;
if (!isLE3) throw new Error("Non little-endian hardware is not supported");
function utf8ToBytes3(str) {
    if (typeof str !== "string") throw new Error("string expected");
    return new Uint8Array(new TextEncoder().encode(str));
}
function toBytes3(data) {
    if (typeof data === "string") data = utf8ToBytes3(data);
    else if (isBytes(data)) data = copyBytes(data);
    else throw new Error("Uint8Array expected, got " + (typeof data === "undefined" ? "undefined" : _type_of(data)));
    return data;
}
function setBigUint642(view, byteOffset, value, isLE4) {
    if (typeof view.setBigUint64 === "function") return view.setBigUint64(byteOffset, value, isLE4);
    var _32n = BigInt(32);
    var _u32_max = BigInt(4294967295);
    var wh = Number(value >> _32n & _u32_max);
    var wl = Number(value & _u32_max);
    var h = isLE4 ? 4 : 0;
    var l = isLE4 ? 0 : 4;
    view.setUint32(byteOffset + h, wh, isLE4);
    view.setUint32(byteOffset + l, wl, isLE4);
}
function copyBytes(bytes2) {
    return Uint8Array.from(bytes2);
}
function clean() {
    for(var _len = arguments.length, arrays = new Array(_len), _key = 0; _key < _len; _key++){
        arrays[_key] = arguments[_key];
    }
    for(var i = 0; i < arrays.length; i++){
        arrays[i].fill(0);
    }
}
// node_modules/.pnpm/@noble+ciphers@1.2.1/node_modules/@noble/ciphers/esm/_polyval.js
var BLOCK_SIZE = 16;
var ZEROS16 = /* @__PURE__ */ new Uint8Array(16);
var ZEROS32 = u32(ZEROS16);
var POLY = 225;
var mul2 = function(s0, s1, s2, s3) {
    var hiBit = s3 & 1;
    return {
        s3: s2 << 31 | s3 >>> 1,
        s2: s1 << 31 | s2 >>> 1,
        s1: s0 << 31 | s1 >>> 1,
        s0: s0 >>> 1 ^ POLY << 24 & -(hiBit & 1)
    };
};
var swapLE = function(n) {
    return (n >>> 0 & 255) << 24 | (n >>> 8 & 255) << 16 | (n >>> 16 & 255) << 8 | n >>> 24 & 255 | 0;
};
function _toGHASHKey(k) {
    k.reverse();
    var hiBit = k[15] & 1;
    var carry = 0;
    for(var i = 0; i < k.length; i++){
        var t = k[i];
        k[i] = t >>> 1 | carry;
        carry = (t & 1) << 7;
    }
    k[0] ^= -hiBit & 225;
    return k;
}
var estimateWindow = function(bytes2) {
    if (bytes2 > 64 * 1024) return 8;
    if (bytes2 > 1024) return 4;
    return 2;
};
var GHASH = /*#__PURE__*/ function() {
    function GHASH(key, expectedLength) {
        _class_call_check(this, GHASH);
        this.blockLen = BLOCK_SIZE;
        this.outputLen = BLOCK_SIZE;
        this.s0 = 0;
        this.s1 = 0;
        this.s2 = 0;
        this.s3 = 0;
        this.finished = false;
        key = toBytes3(key);
        abytes(key, 16);
        var kView = createView2(key);
        var k0 = kView.getUint32(0, false);
        var k1 = kView.getUint32(4, false);
        var k2 = kView.getUint32(8, false);
        var k3 = kView.getUint32(12, false);
        var doubles = [];
        for(var i = 0; i < 128; i++){
            doubles.push({
                s0: swapLE(k0),
                s1: swapLE(k1),
                s2: swapLE(k2),
                s3: swapLE(k3)
            });
            var ref;
            ref = mul2(k0, k1, k2, k3), k0 = ref.s0, k1 = ref.s1, k2 = ref.s2, k3 = ref.s3, ref;
        }
        var W = estimateWindow(expectedLength || 1024);
        if (![
            1,
            2,
            4,
            8
        ].includes(W)) throw new Error("ghash: invalid window size, expected 2, 4 or 8");
        this.W = W;
        var bits = 128;
        var windows = bits / W;
        var windowSize = this.windowSize = Math.pow(2, W);
        var items = [];
        for(var w = 0; w < windows; w++){
            for(var byte = 0; byte < windowSize; byte++){
                var s0 = 0, s1 = 0, s2 = 0, s3 = 0;
                for(var j = 0; j < W; j++){
                    var bit = byte >>> W - j - 1 & 1;
                    if (!bit) continue;
                    var _doubles_ = doubles[W * w + j], d0 = _doubles_.s0, d1 = _doubles_.s1, d2 = _doubles_.s2, d3 = _doubles_.s3;
                    s0 ^= d0, s1 ^= d1, s2 ^= d2, s3 ^= d3;
                }
                items.push({
                    s0: s0,
                    s1: s1,
                    s2: s2,
                    s3: s3
                });
            }
        }
        this.t = items;
    }
    _create_class(GHASH, [
        {
            key: "_updateBlock",
            value: function _updateBlock(s0, s1, s2, s3) {
                s0 ^= this.s0, s1 ^= this.s1, s2 ^= this.s2, s3 ^= this.s3;
                var _this = this, W = _this.W, t = _this.t, windowSize = _this.windowSize;
                var o0 = 0, o1 = 0, o2 = 0, o3 = 0;
                var mask = (1 << W) - 1;
                var w = 0;
                for(var _i = 0, _iter = [
                    s0,
                    s1,
                    s2,
                    s3
                ]; _i < _iter.length; _i++){
                    var num = _iter[_i];
                    for(var bytePos = 0; bytePos < 4; bytePos++){
                        var byte = num >>> 8 * bytePos & 255;
                        for(var bitPos = 8 / W - 1; bitPos >= 0; bitPos--){
                            var bit = byte >>> W * bitPos & mask;
                            var _t_ = t[w * windowSize + bit], e0 = _t_.s0, e1 = _t_.s1, e2 = _t_.s2, e3 = _t_.s3;
                            o0 ^= e0, o1 ^= e1, o2 ^= e2, o3 ^= e3;
                            w += 1;
                        }
                    }
                }
                this.s0 = o0;
                this.s1 = o1;
                this.s2 = o2;
                this.s3 = o3;
            }
        },
        {
            key: "update",
            value: function update(data) {
                data = toBytes3(data);
                aexists(this);
                var b32 = u32(data);
                var blocks = Math.floor(data.length / BLOCK_SIZE);
                var left = data.length % BLOCK_SIZE;
                for(var i = 0; i < blocks; i++){
                    this._updateBlock(b32[i * 4 + 0], b32[i * 4 + 1], b32[i * 4 + 2], b32[i * 4 + 3]);
                }
                if (left) {
                    ZEROS16.set(data.subarray(blocks * BLOCK_SIZE));
                    this._updateBlock(ZEROS32[0], ZEROS32[1], ZEROS32[2], ZEROS32[3]);
                    clean(ZEROS32);
                }
                return this;
            }
        },
        {
            key: "destroy",
            value: function destroy() {
                var t = this.t;
                var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                try {
                    for(var _iterator = t[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                        var elm = _step.value;
                        elm.s0 = 0, elm.s1 = 0, elm.s2 = 0, elm.s3 = 0;
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally{
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return != null) {
                            _iterator.return();
                        }
                    } finally{
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
            }
        },
        {
            key: "digestInto",
            value: function digestInto(out) {
                aexists(this);
                aoutput(out, this);
                this.finished = true;
                var _this = this, s0 = _this.s0, s1 = _this.s1, s2 = _this.s2, s3 = _this.s3;
                var o32 = u32(out);
                o32[0] = s0;
                o32[1] = s1;
                o32[2] = s2;
                o32[3] = s3;
                return out;
            }
        },
        {
            key: "digest",
            value: function digest() {
                var res = new Uint8Array(BLOCK_SIZE);
                this.digestInto(res);
                this.destroy();
                return res;
            }
        }
    ]);
    return GHASH;
}();
var Polyval = /*#__PURE__*/ function(GHASH) {
    _inherits(Polyval, GHASH);
    var _super = _create_super(Polyval);
    function Polyval(key, expectedLength) {
        _class_call_check(this, Polyval);
        key = toBytes3(key);
        var ghKey = _toGHASHKey(copyBytes(key));
        var _this = _super.call(this, ghKey, expectedLength);
        clean(ghKey);
        return _this;
    }
    _create_class(Polyval, [
        {
            key: "update",
            value: function update(data) {
                data = toBytes3(data);
                aexists(this);
                var b32 = u32(data);
                var left = data.length % BLOCK_SIZE;
                var blocks = Math.floor(data.length / BLOCK_SIZE);
                for(var i = 0; i < blocks; i++){
                    this._updateBlock(swapLE(b32[i * 4 + 3]), swapLE(b32[i * 4 + 2]), swapLE(b32[i * 4 + 1]), swapLE(b32[i * 4 + 0]));
                }
                if (left) {
                    ZEROS16.set(data.subarray(blocks * BLOCK_SIZE));
                    this._updateBlock(swapLE(ZEROS32[3]), swapLE(ZEROS32[2]), swapLE(ZEROS32[1]), swapLE(ZEROS32[0]));
                    clean(ZEROS32);
                }
                return this;
            }
        },
        {
            key: "digestInto",
            value: function digestInto(out) {
                aexists(this);
                aoutput(out, this);
                this.finished = true;
                var _this = this, s0 = _this.s0, s1 = _this.s1, s2 = _this.s2, s3 = _this.s3;
                var o32 = u32(out);
                o32[0] = s0;
                o32[1] = s1;
                o32[2] = s2;
                o32[3] = s3;
                return out.reverse();
            }
        }
    ]);
    return Polyval;
}(GHASH);
function wrapConstructorWithKey(hashCons) {
    var hashC = function(msg, key) {
        return hashCons(key, msg.length).update(toBytes3(msg)).digest();
    };
    var tmp2 = hashCons(new Uint8Array(16), 0);
    hashC.outputLen = tmp2.outputLen;
    hashC.blockLen = tmp2.blockLen;
    hashC.create = function(key, expectedLength) {
        return hashCons(key, expectedLength);
    };
    return hashC;
}
var ghash = wrapConstructorWithKey(function(key, expectedLength) {
    return new GHASH(key, expectedLength);
});
var polyval = wrapConstructorWithKey(function(key, expectedLength) {
    return new Polyval(key, expectedLength);
});
// src/sm4/index.ts
var DECRYPT = 0;
var ROUND = 32;
var BLOCK = 16;
var Sbox = Uint8Array.from([
    214,
    144,
    233,
    254,
    204,
    225,
    61,
    183,
    22,
    182,
    20,
    194,
    40,
    251,
    44,
    5,
    43,
    103,
    154,
    118,
    42,
    190,
    4,
    195,
    170,
    68,
    19,
    38,
    73,
    134,
    6,
    153,
    156,
    66,
    80,
    244,
    145,
    239,
    152,
    122,
    51,
    84,
    11,
    67,
    237,
    207,
    172,
    98,
    228,
    179,
    28,
    169,
    201,
    8,
    232,
    149,
    128,
    223,
    148,
    250,
    117,
    143,
    63,
    166,
    71,
    7,
    167,
    252,
    243,
    115,
    23,
    186,
    131,
    89,
    60,
    25,
    230,
    133,
    79,
    168,
    104,
    107,
    129,
    178,
    113,
    100,
    218,
    139,
    248,
    235,
    15,
    75,
    112,
    86,
    157,
    53,
    30,
    36,
    14,
    94,
    99,
    88,
    209,
    162,
    37,
    34,
    124,
    59,
    1,
    33,
    120,
    135,
    212,
    0,
    70,
    87,
    159,
    211,
    39,
    82,
    76,
    54,
    2,
    231,
    160,
    196,
    200,
    158,
    234,
    191,
    138,
    210,
    64,
    199,
    56,
    181,
    163,
    247,
    242,
    206,
    249,
    97,
    21,
    161,
    224,
    174,
    93,
    164,
    155,
    52,
    26,
    85,
    173,
    147,
    50,
    48,
    245,
    140,
    177,
    227,
    29,
    246,
    226,
    46,
    130,
    102,
    202,
    96,
    192,
    41,
    35,
    171,
    13,
    83,
    78,
    111,
    213,
    219,
    55,
    69,
    222,
    253,
    142,
    47,
    3,
    255,
    106,
    114,
    109,
    108,
    91,
    81,
    141,
    27,
    175,
    146,
    187,
    221,
    188,
    127,
    17,
    217,
    92,
    65,
    31,
    16,
    90,
    216,
    10,
    193,
    49,
    136,
    165,
    205,
    123,
    189,
    45,
    116,
    208,
    18,
    184,
    229,
    180,
    176,
    137,
    105,
    151,
    74,
    12,
    150,
    119,
    126,
    101,
    185,
    241,
    9,
    197,
    110,
    198,
    132,
    24,
    240,
    125,
    236,
    58,
    220,
    77,
    32,
    121,
    238,
    95,
    62,
    215,
    203,
    57,
    72
]);
var CK = new Uint32Array([
    462357,
    472066609,
    943670861,
    1415275113,
    1886879365,
    2358483617,
    2830087869,
    3301692121,
    3773296373,
    4228057617,
    404694573,
    876298825,
    1347903077,
    1819507329,
    2291111581,
    2762715833,
    3234320085,
    3705924337,
    4177462797,
    337322537,
    808926789,
    1280531041,
    1752135293,
    2223739545,
    2695343797,
    3166948049,
    3638552301,
    4110090761,
    269950501,
    741554753,
    1213159005,
    1684763257
]);
function byteSub(a) {
    return (Sbox[a >>> 24 & 255] & 255) << 24 | (Sbox[a >>> 16 & 255] & 255) << 16 | (Sbox[a >>> 8 & 255] & 255) << 8 | Sbox[a & 255] & 255;
}
var x = new Uint32Array(4);
var tmp = new Uint32Array(4);
function sms4Crypt(input, output2, roundKey) {
    var x0 = 0, x1 = 0, x2 = 0, x3 = 0, tmp0 = 0, tmp1 = 0, tmp2 = 0, tmp3 = 0;
    tmp0 = input[0] & 255;
    tmp1 = input[1] & 255;
    tmp2 = input[2] & 255;
    tmp3 = input[3] & 255;
    x0 = tmp0 << 24 | tmp1 << 16 | tmp2 << 8 | tmp3;
    tmp0 = input[4] & 255;
    tmp1 = input[5] & 255;
    tmp2 = input[6] & 255;
    tmp3 = input[7] & 255;
    x1 = tmp0 << 24 | tmp1 << 16 | tmp2 << 8 | tmp3;
    tmp0 = input[8] & 255;
    tmp1 = input[9] & 255;
    tmp2 = input[10] & 255;
    tmp3 = input[11] & 255;
    x2 = tmp0 << 24 | tmp1 << 16 | tmp2 << 8 | tmp3;
    tmp0 = input[12] & 255;
    tmp1 = input[13] & 255;
    tmp2 = input[14] & 255;
    tmp3 = input[15] & 255;
    x3 = tmp0 << 24 | tmp1 << 16 | tmp2 << 8 | tmp3;
    for(var r = 0; r < 32; r += 4){
        tmp0 = x1 ^ x2 ^ x3 ^ roundKey[r];
        tmp0 = byteSub(tmp0);
        x0 ^= tmp0 ^ (tmp0 << 2 | tmp0 >>> 30) ^ (tmp0 << 10 | tmp0 >>> 22) ^ (tmp0 << 18 | tmp0 >>> 14) ^ (tmp0 << 24 | tmp0 >>> 8);
        tmp1 = x2 ^ x3 ^ x0 ^ roundKey[r + 1];
        tmp1 = byteSub(tmp1);
        x1 ^= tmp1 ^ (tmp1 << 2 | tmp1 >>> 30) ^ (tmp1 << 10 | tmp1 >>> 22) ^ (tmp1 << 18 | tmp1 >>> 14) ^ (tmp1 << 24 | tmp1 >>> 8);
        tmp2 = x3 ^ x0 ^ x1 ^ roundKey[r + 2];
        tmp2 = byteSub(tmp2);
        x2 ^= tmp2 ^ (tmp2 << 2 | tmp2 >>> 30) ^ (tmp2 << 10 | tmp2 >>> 22) ^ (tmp2 << 18 | tmp2 >>> 14) ^ (tmp2 << 24 | tmp2 >>> 8);
        tmp3 = x0 ^ x1 ^ x2 ^ roundKey[r + 3];
        tmp3 = byteSub(tmp3);
        x3 ^= tmp3 ^ (tmp3 << 2 | tmp3 >>> 30) ^ (tmp3 << 10 | tmp3 >>> 22) ^ (tmp3 << 18 | tmp3 >>> 14) ^ (tmp3 << 24 | tmp3 >>> 8);
    }
    output2[0] = x3 >>> 24 & 255;
    output2[1] = x3 >>> 16 & 255;
    output2[2] = x3 >>> 8 & 255;
    output2[3] = x3 & 255;
    output2[4] = x2 >>> 24 & 255;
    output2[5] = x2 >>> 16 & 255;
    output2[6] = x2 >>> 8 & 255;
    output2[7] = x2 & 255;
    output2[8] = x1 >>> 24 & 255;
    output2[9] = x1 >>> 16 & 255;
    output2[10] = x1 >>> 8 & 255;
    output2[11] = x1 & 255;
    output2[12] = x0 >>> 24 & 255;
    output2[13] = x0 >>> 16 & 255;
    output2[14] = x0 >>> 8 & 255;
    output2[15] = x0 & 255;
}
function sms4KeyExt(key, roundKey, cryptFlag) {
    var x0 = 0, x1 = 0, x2 = 0, x3 = 0, mid = 0;
    x0 = (key[0] & 255) << 24 | (key[1] & 255) << 16 | (key[2] & 255) << 8 | key[3] & 255;
    x1 = (key[4] & 255) << 24 | (key[5] & 255) << 16 | (key[6] & 255) << 8 | key[7] & 255;
    x2 = (key[8] & 255) << 24 | (key[9] & 255) << 16 | (key[10] & 255) << 8 | key[11] & 255;
    x3 = (key[12] & 255) << 24 | (key[13] & 255) << 16 | (key[14] & 255) << 8 | key[15] & 255;
    x0 ^= 2746333894;
    x1 ^= 1453994832;
    x2 ^= 1736282519;
    x3 ^= 2993693404;
    for(var r = 0; r < 32; r += 4){
        mid = x1 ^ x2 ^ x3 ^ CK[r + 0];
        mid = byteSub(mid);
        x0 ^= mid ^ (mid << 13 | mid >>> 19) ^ (mid << 23 | mid >>> 9);
        roundKey[r + 0] = x0;
        mid = x2 ^ x3 ^ x0 ^ CK[r + 1];
        mid = byteSub(mid);
        x1 ^= mid ^ (mid << 13 | mid >>> 19) ^ (mid << 23 | mid >>> 9);
        roundKey[r + 1] = x1;
        mid = x3 ^ x0 ^ x1 ^ CK[r + 2];
        mid = byteSub(mid);
        x2 ^= mid ^ (mid << 13 | mid >>> 19) ^ (mid << 23 | mid >>> 9);
        roundKey[r + 2] = x2;
        mid = x0 ^ x1 ^ x2 ^ CK[r + 3];
        mid = byteSub(mid);
        x3 ^= mid ^ (mid << 13 | mid >>> 19) ^ (mid << 23 | mid >>> 9);
        roundKey[r + 3] = x3;
    }
    if (cryptFlag === DECRYPT) {
        for(var r1 = 0; r1 < 16; r1++){
            var ref;
            ref = [
                roundKey[31 - r1],
                roundKey[r1]
            ], roundKey[r1] = ref[0], roundKey[31 - r1] = ref[1], ref;
        }
    }
}
function incrementCounter(counter) {
    for(var i = counter.length - 1; i >= 0; i--){
        counter[i]++;
        if (counter[i] !== 0) break;
    }
}
function sm4Gcm(inArray, key, ivArray, aadArray, cryptFlag, tagArray) {
    var deriveKeys = function deriveKeys() {
        var roundKey2 = new Uint32Array(ROUND);
        sms4KeyExt(key, roundKey2, 1);
        var authKey = new Uint8Array(16).fill(0);
        var h2 = new Uint8Array(16);
        sms4Crypt(authKey, h2, roundKey2);
        var j02;
        if (ivArray.length === 12) {
            j02 = new Uint8Array(16);
            j02.set(ivArray, 0);
            j02[15] = 1;
        } else {
            var g = ghash.create(h2);
            g.update(ivArray);
            var lenIv = new Uint8Array(16);
            var view = createView2(lenIv);
            setBigUint642(view, 8, BigInt(ivArray.length * 8), false);
            g.update(lenIv);
            j02 = g.digest();
        }
        var counter2 = new Uint8Array(j02);
        incrementCounter(counter2);
        var tagMask2 = new Uint8Array(16);
        sms4Crypt(j02, tagMask2, roundKey2);
        return {
            roundKey: roundKey2,
            h: h2,
            j0: j02,
            counter: counter2,
            tagMask: tagMask2
        };
    };
    var computeTag = function computeTag(h2, data) {
        var aadLength = aadArray.length;
        var dataLength = data.length;
        var g = ghash.create(h2);
        if (aadLength > 0) {
            g.update(aadArray);
        }
        g.update(data);
        var lenBlock = new Uint8Array(16);
        var view = createView2(lenBlock);
        setBigUint642(view, 0, BigInt(aadLength * 8), false);
        setBigUint642(view, 8, BigInt(dataLength * 8), false);
        g.update(lenBlock);
        return g.digest();
    };
    var tagLength = 16;
    var _deriveKeys = deriveKeys(), roundKey = _deriveKeys.roundKey, h = _deriveKeys.h, j0 = _deriveKeys.j0, counter = _deriveKeys.counter, tagMask = _deriveKeys.tagMask;
    if (cryptFlag === DECRYPT && tagArray) {
        var calculatedTag = computeTag(h, inArray);
        for(var i = 0; i < 16; i++){
            calculatedTag[i] ^= tagMask[i];
        }
        var tagMatch = 0;
        for(var i1 = 0; i1 < 16; i1++){
            tagMatch |= calculatedTag[i1] ^ tagArray[i1];
        }
        if (tagMatch !== 0) {
            throw new Error("authentication tag mismatch");
        }
    }
    var outArray = new Uint8Array(inArray.length);
    var point = 0;
    var restLen = inArray.length;
    while(restLen >= BLOCK){
        var blockOut = new Uint8Array(BLOCK);
        sms4Crypt(counter, blockOut, roundKey);
        for(var i2 = 0; i2 < BLOCK && i2 < restLen; i2++){
            outArray[point + i2] = inArray[point + i2] ^ blockOut[i2];
        }
        incrementCounter(counter);
        point += BLOCK;
        restLen -= BLOCK;
    }
    if (restLen > 0) {
        var blockOut1 = new Uint8Array(BLOCK);
        sms4Crypt(counter, blockOut1, roundKey);
        for(var i3 = 0; i3 < restLen; i3++){
            outArray[point + i3] = inArray[point + i3] ^ blockOut1[i3];
        }
    }
    if (cryptFlag !== DECRYPT) {
        var calculatedTag1 = computeTag(h, outArray);
        for(var i4 = 0; i4 < 16; i4++){
            calculatedTag1[i4] ^= tagMask[i4];
        }
        return {
            output: outArray,
            tag: calculatedTag1
        };
    }
    return {
        output: outArray
    };
}
var blockOutput = new Uint8Array(16);
function sm4(inArray, key, cryptFlag) {
    var options = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
    var _options_padding = options.padding, padding = _options_padding === void 0 ? "pkcs#7" : _options_padding, mode = options.mode, _options_iv = options.iv, iv = _options_iv === void 0 ? new Uint8Array(16) : _options_iv, output2 = options.output, associatedData = options.associatedData, outputTag = options.outputTag, tag = options.tag;
    if (mode === "gcm") {
        var keyArray = typeof key === "string" ? hexToArray(key) : Uint8Array.from(key);
        var ivArray = typeof iv === "string" ? hexToArray(iv) : Uint8Array.from(iv);
        var aadArray = associatedData ? typeof associatedData === "string" ? hexToArray(associatedData) : Uint8Array.from(associatedData) : new Uint8Array(0);
        var inputArray;
        if (typeof inArray === "string") {
            if (cryptFlag !== DECRYPT) {
                inputArray = utf8ToArray(inArray);
            } else {
                inputArray = hexToArray(inArray);
            }
        } else {
            inputArray = Uint8Array.from(inArray);
        }
        var tagArray = tag ? typeof tag === "string" ? hexToArray(tag) : Uint8Array.from(tag) : void 0;
        var result = sm4Gcm(inputArray, keyArray, ivArray, aadArray, cryptFlag, tagArray);
        if (output2 === "array") {
            if (outputTag && cryptFlag !== DECRYPT) {
                return result;
            }
            return result.output;
        } else {
            if (outputTag && cryptFlag !== DECRYPT) {
                return {
                    output: bytesToHex2(result.output),
                    tag: result.tag ? bytesToHex2(result.tag) : void 0
                };
            }
            if (cryptFlag !== DECRYPT) {
                return {
                    output: bytesToHex2(result.output),
                    tag: result.tag ? bytesToHex2(result.tag) : void 0
                };
            } else {
                return arrayToUtf8(result.output);
            }
        }
    }
    if (mode === "cbc") {
        if (typeof iv === "string") iv = hexToArray(iv);
        if (iv.length !== 128 / 8) {
            throw new Error("iv is invalid");
        }
    }
    if (typeof key === "string") key = hexToArray(key);
    if (key.length !== 128 / 8) {
        throw new Error("key is invalid");
    }
    if (typeof inArray === "string") {
        if (cryptFlag !== DECRYPT) {
            inArray = utf8ToArray(inArray);
        } else {
            inArray = hexToArray(inArray);
        }
    } else {
        inArray = Uint8Array.from(inArray);
    }
    if ((padding === "pkcs#5" || padding === "pkcs#7") && cryptFlag !== DECRYPT) {
        var paddingCount = BLOCK - inArray.length % BLOCK;
        var newArray = new Uint8Array(inArray.length + paddingCount);
        newArray.set(inArray, 0);
        for(var i = 0; i < paddingCount; i++)newArray[inArray.length + i] = paddingCount;
        inArray = newArray;
    }
    var roundKey = new Uint32Array(ROUND);
    sms4KeyExt(key, roundKey, cryptFlag);
    var outArray = new Uint8Array(inArray.length);
    var lastVector = iv;
    var restLen = inArray.length;
    var point = 0;
    while(restLen >= BLOCK){
        var input = inArray.subarray(point, point + 16);
        if (mode === "cbc") {
            for(var i1 = 0; i1 < BLOCK; i1++){
                if (cryptFlag !== DECRYPT) {
                    input[i1] ^= lastVector[i1];
                }
            }
        }
        sms4Crypt(input, blockOutput, roundKey);
        for(var i2 = 0; i2 < BLOCK; i2++){
            if (mode === "cbc") {
                if (cryptFlag === DECRYPT) {
                    blockOutput[i2] ^= lastVector[i2];
                }
            }
            outArray[point + i2] = blockOutput[i2];
        }
        if (mode === "cbc") {
            if (cryptFlag !== DECRYPT) {
                lastVector = blockOutput;
            } else {
                lastVector = input;
            }
        }
        restLen -= BLOCK;
        point += BLOCK;
    }
    if ((padding === "pkcs#5" || padding === "pkcs#7") && cryptFlag === DECRYPT) {
        var len = outArray.length;
        var paddingCount1 = outArray[len - 1];
        for(var i3 = 1; i3 <= paddingCount1; i3++){
            if (outArray[len - i3] !== paddingCount1) throw new Error("padding is invalid");
        }
        outArray = outArray.slice(0, len - paddingCount1);
    }
    if (output2 !== "array") {
        if (cryptFlag !== DECRYPT) {
            return bytesToHex2(outArray);
        } else {
            return arrayToUtf8(outArray);
        }
    } else {
        return outArray;
    }
}
function encrypt(inArray, key) {
    var options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    return sm4(inArray, key, 1, options);
}
function decrypt(inArray, key) {
    var options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    return sm4(inArray, key, 0, options);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
    hkdf: hkdf,
    kdf: kdf,
    sm2: sm2,
    sm3: sm3,
    sm4: sm4
}); /*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */  /*! Bundled license information:

@noble/curves/esm/abstract/utils.js:
  (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/curves/esm/abstract/modular.js:
  (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/curves/esm/abstract/curve.js:
  (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/curves/esm/abstract/weierstrass.js:
  (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/hashes/esm/utils.js:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/ciphers/esm/utils.js:
  (*! noble-ciphers - MIT License (c) 2023 Paul Miller (paulmillr.com) *)
*/ 
