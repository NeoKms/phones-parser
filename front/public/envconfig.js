window.envConfig = (() => {
  let envstring = "__STRING__";
  envstring = envstring.split(";");
  const result = {
    API_URL: "http://localhost:3000",
    WS_URL: "http://localhost:9000",
  };
  for (let i = 0; i < envstring.length; i++) {
    if (envstring[i].indexOf("=") + 1) {
      const splitted = envstring[i].split("=");
      result[splitted[0].split("VUE_")[1]] = splitted[1];
    }
  }
  return result;
})();
