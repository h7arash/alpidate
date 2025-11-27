// src/alpidate.js
function validateValue(value, rules, data) {
  const result = { $invalid: false };
  rules.forEach((r) => {
    const [rule, param] = r.split(":");
    let error = false;
    switch (rule) {
      case "required":
        error = value === null || value === "" || value === void 0 || Array.isArray(value) && value.length === 0;
        break;
      case "requiredIf":
        const [field, expected] = param.split(",");
        const actual = data[field];
        const shouldBeRequired = "" + actual === expected;
        if (shouldBeRequired)
          error = value === null || value === "" || value === void 0;
        break;
      case "array":
        error = !Array.isArray(value);
        break;
      case "min":
        if (typeof value === "string" || Array.isArray(value))
          error = value.length < Number(param);
        break;
      case "max":
        if (typeof value === "string" || Array.isArray(value))
          error = value.length > Number(param);
        break;
      case "numeric":
        error = isNaN(value);
        break;
      case "email":
        error = !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value);
        break;
      case "regex":
        try {
          const regex = param ? new RegExp(param) : null;
          error = regex ? !regex.test(value) : true;
        } catch {
          error = true;
        }
        break;
    }
    result[rule] = error;
    if (error)
      result.$invalid = true;
  });
  return result;
}
function expandWildcardValidations(data, validationsRules) {
  const expanded = {};
  for (let path in validationsRules) {
    if (path.includes("*")) {
      const parts = path.split(".");
      let arrayKey = parts[0];
      let arr = data[arrayKey] || [];
      arr.forEach((_, idx) => {
        const expandedPath = path.replace("*", idx);
        expanded[expandedPath] = validationsRules[path];
      });
    } else {
      expanded[path] = validationsRules[path];
    }
  }
  return expanded;
}
function createValidationWatcher(data, validationsRules, key) {
  const expandedValidations = expandWildcardValidations(data, validationsRules);
  for (let model in expandedValidations) {
    data[key].validate(model);
    data.$watch(model, () => data[key].validate(model));
  }
  return data;
}
function alpidatePlugin(Alpine) {
  Alpine.magic("validation", () => (data, key = null) => {
    if (!key) {
      key = "$v";
    }
    data[key] = {};
    data[key].$touch = false;
    data[key].$invalid = true;
    const validationsRules = JSON.parse(JSON.stringify(data.validations));
    data[key].validate = (modelName = null) => {
      const expandedValidations = expandWildcardValidations(data, validationsRules);
      const models = modelName ? [modelName] : Object.keys(expandedValidations);
      if (!modelName)
        data[key].$touch = true;
      models.forEach((model) => {
        const rules = expandedValidations[model];
        const chain = model.split(".");
        let currentV = data[key];
        let currentData = data;
        chain.forEach((key2, idx) => {
          if (!isNaN(Number(key2))) {
            currentData = currentData[key2];
            return;
          }
          if (!currentV[key2])
            currentV[key2] = { $invalid: false };
          currentV = currentV[key2];
          currentData = currentData[key2] ?? currentData[key2];
        });
        Object.assign(currentV, validateValue(currentData, rules, data));
        if (Array.isArray(currentData)) {
          const wildcardKey = Object.keys(validationsRules).find((k) => k.includes("*") && k.startsWith(chain[0]));
          if (wildcardKey) {
            currentV.each = currentData.map((item, idx) => {
              const itemResult = {};
              const subRules = Object.keys(validationsRules).filter((p) => p.startsWith(chain[0] + ".*")).map((p) => {
                const fieldName = p.split(".").slice(-1)[0];
                return { fieldName, rules: validationsRules[p] };
              });
              subRules.forEach((sr) => {
                itemResult[sr.fieldName] = validateValue(item[sr.fieldName], sr.rules, data);
              });
              return itemResult;
            });
            currentV.$invalid = currentV.each.some(
              (e) => Object.values(e).some((f) => f.$invalid)
            );
          }
        }
        const parts = model.split(".");
        if (parts.length > 1) {
          let cursor = data[key];
          for (let i = 0; i < parts.length - 1; i++) {
            const segment = parts[i];
            if (!cursor[segment])
              continue;
            const child = cursor[segment];
            child.$invalid = Object.values(child).filter((v) => typeof v === "object" && v !== null).some((v) => v.$invalid);
            cursor = child;
          }
        }
      });
    };
    data[key].reset = () => data[key].$touch = false;
    data = createValidationWatcher(data, validationsRules, key);
    data.$watch(key, () => {
      data[key].$invalid = Object.keys(data[key]).some((k) => {
        if (k.startsWith("$"))
          return false;
        const v = data[key][k];
        if (v.$invalid)
          return true;
        if (v.each)
          return v.each.some((e) => Object.values(e).some((f) => f.$invalid));
        return false;
      });
    });
    Object.entries(validationsRules).forEach(([field, rules]) => {
      rules.forEach((rule) => {
        if (rule.startsWith("requiredIf:")) {
          const onEffectModel = rule.split(":")[1].split(",")[0];
          data.$watch(onEffectModel, () => {
            data[key].validate(field);
          });
        }
      });
    });
  });
}
(function exposeToGlobal() {
  const root = typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : this;
  if (root && !root.alpidate) {
    root.alpidate = alpidatePlugin;
  }
})();
var alpidate_default = alpidatePlugin;
export {
  alpidate_default as default
};
