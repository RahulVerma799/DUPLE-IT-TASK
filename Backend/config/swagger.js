import swaggerJsdoc from "swagger-jsdoc";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Task Management API",
            version: "1.0.0",
            description: "API for managing teams and tasks with Kanban board features",
        },
        servers: [
            {
                url: "http://localhost:5000/api",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "apiKey",
                    name: "x-user-token",
                    in: "header",
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ["./route/*.js"], // files containing annotations as above
};

export const swaggerSpec = swaggerJsdoc(options);
