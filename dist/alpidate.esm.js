// src/alpidate.js
function createValidationWatcher(data) {
  for (let model in data.validations) {
    let chain = model.split(".");
    data.$watch(model, () => {
      data.validate(model);
    });
    let parentModel = data.$v;
    chain.forEach((upperModel) => {
      if (parentModel[upperModel] === void 0) {
        parentModel[upperModel] = {};
      }
      if (parentModel[upperModel] !== void 0) {
        parentModel = parentModel[upperModel];
      }
    });
    let modelInDeep = parentModel;
    data.validations[model].forEach((rule) => {
      rule = rule.split(":");
      modelInDeep[rule[0]] = null;
    });
  }
  return data;
}
function alpidate_default(Alpine) {
  Alpine.magic("validation", () => (data) => {
    data.$v = {};
    data.$v.$touch = false;
    data.validate = (modelName = null) => {
      let error = false;
      let message = "";
      let models = [];
      if (modelName == null) {
        data.$v.$touch = true;
        models = Object.keys(data.validations);
      } else {
        models = [modelName];
      }
      models.forEach((model) => {
        let rules = data.validations[model];
        if (typeof rules === "string") {
          rules = [rules];
        }
        let currentVModel = data.$v;
        let currentModel = data;
        model.split(".").forEach((upperModel) => {
          if (currentVModel[upperModel] !== void 0) {
            currentVModel = currentVModel[upperModel];
            currentModel = currentModel[upperModel];
          }
        });
        currentVModel.$invalid = false;
        rules.forEach((rule) => {
          rule = rule.split(":");
          switch (rule[0]) {
            case "required":
              error = currentModel === null || currentModel === "" || !currentModel;
              break;
            case "numeric":
              error = isNaN(currentModel);
              break;
            case "email":
              error = !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(currentModel);
              break;
            case "regex":
              if (!rule[1]) {
                error = true;
                break;
              }
              let regex = new RegExp(rule[1]);
              error = !regex.test(currentModel);
              break;
            case "min":
              if (!rule[1]) {
                error = true;
                break;
              }
              error = currentModel.length < rule[1];
              break;
            case "max":
              if (!rule[1]) {
                error = true;
                break;
              }
              error = currentModel.length > rule[1];
              break;
          }
          if (!currentVModel.$invalid) {
            currentVModel.$invalid = error;
          }
          currentVModel[rule[0]] = error;
        });
      });
    };
    data.$v.$invalid = true;
    data = createValidationWatcher(data);
    data.$watch("$v", () => {
      let inValid = false;
      for (let model of Object.keys(data.validations)) {
        let modelInDeep = data.$v;
        model.split(".").forEach((upperModel) => {
          if (modelInDeep[upperModel] !== void 0) {
            modelInDeep = modelInDeep[upperModel];
          }
        });
        for (let validation of Object.keys(modelInDeep)) {
          inValid = modelInDeep[validation] || modelInDeep[validation] === null;
          if (inValid)
            break;
        }
        if (inValid)
          break;
      }
      data.$v.$invalid = inValid;
    });
  });
}
export {
  alpidate_default as default
};
