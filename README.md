# alpidate**A lightweight validation plugin for Alpine.js inspired by Vuelidate.**## InstallationYou can install `alpidate` via npm:```shnpm install alpidate```## Usage### Import and Register the PluginFirst, import Alpine.js and `alpidate`, then register the plugin:```jsimport Alpine from 'alpinejs';import alpidate from 'alpidate';Alpine.plugin(alpidate);```### Setting Up Validation in a ComponentDefine validation rules inside the `validations` property and initialize validation in `init()`:```jsAlpine.data('app', () => ({    init() {        this.$validation(this);    },    validations: {        'firstName': ['required', 'min:3'],        'lastName': ['required', 'min:3'],        'email': ['required', 'email'],        'phone': ['required'],        'form.firstName': ['required', 'min:3']    }}));```### Supported Validation Rules- `required` - Ensures the field is not empty.- `numeric` - The field must contain only numbers.- `email` - Validates an email format.- `regex` - Allows custom validation rules using regular expressions.- `min:value` - Specifies the minimum length or value.- `max:value` - Specifies the maximum length or value.This plugin also supports **nested models**, for example:```js'from.firstName': ['required', 'min:3']```### Accessing Validation StateEach model's validation state is stored in `$v`. The validation automatically updates when the model changes.If you want to prevent error messages from displaying immediately, use `$v.$touch`. This remains `false` until you manually trigger validation using:```jsthis.validate();```### Displaying Validation Errors in TemplateUse Alpine.js directives to show validation errors dynamically:```html<span x-show="$v.firstName.invalid && $v.$touch">    <small x-show="$v.firstName.required" class="text-red absolute sm:bottom-0 -bottom-12">        First Name is Required    </small>    <small x-show="!$v.firstName.required && $v.firstName.min" class="text-red absolute sm:bottom-0 -bottom-12">        Must be at least 3 characters    </small></span>```### Understanding the Validation State- Each model inside `$v` has an `invalid` property indicating if all assigned validation rules pass.- `$v.$touch` helps control when validation messages appear (e.g., after form submission).## LicenseMIT License