module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "subject-empty": [0, "never"],
    "type-empty": [0, "never"],
    "subject-full-stop": [0, "never"],
  },
};
