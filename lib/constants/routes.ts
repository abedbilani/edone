const POST = 'POST';
const GET = 'GET';
const PUT = 'PUT';
const DELETE = 'DELETE';

export const ROUTES = {
    apiName: `api`,
    serviceName: 'api-backend',
    prefix: '/',
    routes: [
        {
            routeId: 'collections-all',
            method: GET,
            path: 'collections',
        },
        {
            routeId: 'collections-add',
            method: POST,
            path: 'collections',
        },
        {
            routeId: 'collections-update',
            method: PUT,
            path: 'collections/{collectionId}',
        },
        {
            routeId: 'collection-lectures',
            method: GET,
            path: 'collections/{collectionId}/lectures',
        },
        {
            routeId: 'delete-collection',
            method: DELETE,
            path: 'collections/{collectionId}',
        },

        {
            routeId: 'lectures-add',
            method: POST,
            path: 'lectures',
        },
        {
            routeId: 'lectures-one',
            method: GET,
            path: 'lectures/{lectureId}',
        },
        {
            routeId: 'lectures-generate',
            method: PUT,
            path: 'lectures/{lectureId}/generate',
        },
        {
            routeId: 'lectures-update',
            method: PUT,
            path: 'lectures/{lectureId}',
        },
        {
            routeId: 'chatbot-process-message',
            method: POST,
            path: 'embeddings/process-message',
        },
        {
            routeId: 'lectures-translate',
            method: POST,
            path: 'lectures/{lectureId}/translate',
        },
        {
            routeId: 'lectures-export',
            method: GET,
            path: 'lectures/{lectureId}/quiz/export',
        },
    ],
};
