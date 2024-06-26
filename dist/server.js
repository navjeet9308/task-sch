"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const PORT = process.env.PORT || 3002;
app_1.default.listen(PORT, () => {
    console.log(`Server.TS is running on port ${PORT}`);
}).on('error', (error) => {
    console.error('Server error:', error);
});
