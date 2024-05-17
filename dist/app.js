"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = require("body-parser");
const database_1 = require("./utils/database");
const taskController_1 = require("./controllers/taskController");
const scheduler_1 = require("./services/scheduler");
const app = (0, express_1.default)();
app.use((0, body_parser_1.json)());
app.post('/tasks', taskController_1.createTask);
app.get('/tasks', taskController_1.getTasks);
app.delete('/tasks/:id', taskController_1.deleteTask);
(0, database_1.connectDatabase)().then(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log('connected..');
    yield (0, scheduler_1.loadAndScheduleAllTasks)(); // Load and schedule tasks on startup
})).catch(error => {
    console.error('Database connection failed:', error);
});
exports.default = app;
