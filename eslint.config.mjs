import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
      'no-unused-expressions': 'off',
      'no-console': 'off',
      'no-debugger': 'off',
      'no-undef': 'off',
      'no-empty': 'off',
      'no-case-declarations': 'off',
      'no-redeclare': 'off',
      'no-constant-condition': 'off',
      'no-fallthrough': 'off',
      'no-unreachable': 'off',
      'no-mixed-spaces-and-tabs': 'off',
      'no-irregular-whitespace': 'off',
      'no-prototype-builtins': 'off',
      'no-extra-boolean-cast': 'off',
      'no-extra-semi': 'off',
      'no-dupe-keys': 'off',
      'no-dupe-args': 'off',
      'no-duplicate-case': 'off',
      'no-empty-pattern': 'off',
      'no-self-assign': 'off',
      'no-self-compare': 'off',
      'no-unexpected-multiline': 'off',
      'no-unreachable-loop': 'off',
      'no-unsafe-finally': 'off',
      'no-unsafe-negation': 'off',
      'no-var': 'off',
      'prefer-const': 'off',
      'prefer-template': 'off',
      'eqeqeq': 'off',
      'curly': 'off',
      'semi': 'off',
      'quotes': 'off',
      'comma-dangle': 'off',
      'object-curly-spacing': 'off',
      'array-bracket-spacing': 'off',
      'space-before-function-paren': 'off',
      'keyword-spacing': 'off',
      'space-infix-ops': 'off',
      'arrow-spacing': 'off',
      'spaced-comment': 'off',
      'indent': 'off',
      // Add more rules as needed
    },
  },
];

export default eslintConfig;
