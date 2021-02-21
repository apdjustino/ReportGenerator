import { format } from "d3-format";

export const formatCurrency = val => format("($,.2f")(val);
export const sortBy = (key) => {
    return (a, b) => (a[key] > b[key]) ? 1 : ((b[key] > a[key]) ? -1 : 0);
};