// src/alpidate.js
function validateValue(value, rules) {
  const result = { $invalid: false };
  rules.forEach((r) => {
    const [rule, param] = r.split(":");
    let error = false;
    switch (rule) {
      case "required":
        error = value === null || value === "" || value === void 0 || Array.isArray(value) && value.length === 0;
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
function expandWildcardValidations(data) {
  const expanded = {};
  for (let path in data.validations) {
    if (path.includes("*")) {
      const parts = path.split(".");
      let arrayKey = parts[0];
      let arr = data[arrayKey] || [];
      arr.forEach((_, idx) => {
        const expandedPath = path.replace("*", idx);
        expanded[expandedPath] = data.validations[path];
      });
    } else {
      expanded[path] = data.validations[path];
    }
  }
  return expanded;
}
function createValidationWatcher(data) {
  const expandedValidations = expandWildcardValidations(data);
  for (let model in expandedValidations) {
    data.validate(model);
    data.$watch(model, () => data.validate(model));
  }
  return data;
}
function alpidate_default(Alpine) {
  Alpine.magic("validation", () => (data) => {
    data.$v = {};
    data.$v.$touch = false;
    data.$v.$invalid = true;
    data.validate = (modelName = null) => {
      const expandedValidations = expandWildcardValidations(data);
      const models = modelName ? [modelName] : Object.keys(expandedValidations);
      if (!modelName)
        data.$v.$touch = true;
      models.forEach((model) => {
        const rules = expandedValidations[model];
        const chain = model.split(".");
        let currentV = data.$v;
        let currentData = data;
        chain.forEach((key, idx) => {
          if (!isNaN(Number(key))) {
            currentData = currentData[key];
            return;
          }
          if (!currentV[key])
            currentV[key] = { $invalid: false };
          currentV = currentV[key];
          currentData = currentData[key] ?? currentData[key];
        });
        Object.assign(currentV, validateValue(currentData, rules));
        if (Array.isArray(currentData)) {
          const wildcardKey = Object.keys(data.validations).find((k) => k.includes("*") && k.startsWith(chain[0]));
          if (wildcardKey) {
            currentV.each = currentData.map((item, idx) => {
              const itemResult = {};
              const subRules = Object.keys(data.validations).filter((p) => p.startsWith(chain[0] + ".*")).map((p) => {
                const fieldName = p.split(".").slice(-1)[0];
                return { fieldName, rules: data.validations[p] };
              });
              subRules.forEach((sr) => {
                itemResult[sr.fieldName] = validateValue(item[sr.fieldName], sr.rules);
              });
              return itemResult;
            });
            currentV.$invalid = currentV.each.some(
              (e) => Object.values(e).some((f) => f.$invalid)
            );
          }
        }
      });
    };
    data.$v.reset = () => data.$v.$touch = false;
    data = createValidationWatcher(data);
    data.$watch("$v", () => {
      data.$v.$invalid = Object.keys(data.$v).some((k) => {
        if (k.startsWith("$"))
          return false;
        const v = data.$v[k];
        if (v.$invalid)
          return true;
        if (v.each)
          return v.each.some((e) => Object.values(e).some((f) => f.$invalid));
        return false;
      });
    });
  });
}
export {
  alpidate_default as default
};
