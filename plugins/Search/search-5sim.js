import fetch from "node-fetch";
const token = process.env.API_TOKEN;
const fetchAPI = async (url) => {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error(`Failed to fetch from ${url}`);
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch from ${url}: ${error.message}`);
    }
  },
  getCountryList = async () => {
    try {
      const data = await fetchAPI("https://5sim.net/v1/guest/countries");
      return Object.keys(data).sort();
    } catch (error) {
      throw new Error("Failed to fetch country list");
    }
  },
  getProductList = async (provider, country) => {
    try {
      return await fetchAPI(
        `https://5sim.net/v1/guest/products/${country}/${provider}`,
      );
    } catch (error) {
      throw new Error(
        `Failed to fetch product list for ${provider} in ${country}`,
      );
    }
  },
  handler = async (m, { args }) => {
    try {
      let [country, provider, price] = args.map((arg) => arg.toLowerCase());
      (provider = provider || "any"),
        (country = country || "indonesia"),
        (price = parseFloat(price) || 1340);
      const countryList = await getCountryList();
      if (!countryList.includes(country))
        return m.reply(
          `🚫 Country *${country.toUpperCase()}* is not available. Available countries are:\n\n${countryList.map((c) => `- ${c.toUpperCase()}`).join("\n")}`,
        );
      const productList = await getProductList(provider, country),
        filteredProducts = Object.keys(productList).filter(
          (key) => productList[key].Price <= price,
        );
      if (0 === filteredProducts.length)
        return m.reply(
          `🚫 No products found for *${provider.toUpperCase()}* in *${country.toUpperCase()}* under *${price}*.`,
        );
      const reply = `*💡 Products for ${provider.toUpperCase()} in ${country.toUpperCase()} under ${price}:*\n\n${filteredProducts.map((key) => `- *${key.toUpperCase()}:* ${productList[key].Price}\n- *Category:* ${productList[key].Category}\n- *Qty:* ${productList[key].Qty}`).join("\n\n")}`;
      m.reply(reply);
    } catch (error) {
      m.reply(`❌ Error: ${error.message || error}`);
    }
  };
(handler.tags = ["search"]),
  (handler.help = ["search"]),
  (handler.command = /^5sim$/i);
export default handler;
