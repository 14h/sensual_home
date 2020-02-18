
export default {
    /**
     *
     * @param {string} method The method of the request like POST or GET
     * @param {string} url the url to fetch from the api
     * @param {Function} successCb callback that is called when request is successful
     * @param {Function} errorCb callback that is called when an error accours
     */
    _requestJSON( method = 'GET', url, successCb = console.log, errorCb = console.warn )
    {
        const USE_ASYNC = true;
        const XHR_DONE  = 4;

        const xhr = new XMLHttpRequest();
        if ( xhr.withCredentials )
        {
            xhr.withCredentials = true;
        }

        xhr.open( method, url, USE_ASYNC );
        /**
         * is called when the request is done. It will call success callback when successfully
         * loaded the request and an error callback when ready state is not DONE.
         */
        xhr.onload = () =>
        {
            if ( xhr.readyState === XHR_DONE )
            {
                // Every HTTP status code is accepted here, because products that were not found
                // or out of stock or do not yield 200 OK status.
                let responseJson = null;

                try
                {
                    responseJson = JSON.parse( xhr.responseText );
                }
                catch ( err )
                {
                    const error = new Error( `${url} responded with error: ${err}` );
                    errorCb( error );

                    return;
                }

                if ( !responseJson )
                {
                    const error = new Error( `${url} provided no response` );
                    errorCb( error );

                    return;
                }

                if (  responseJson.error )
                {
                    let message = responseJson.message;
                    if ( !message )
                    {
                        message = responseJson.error;
                    }

                    const error = new Error(
                        `${url} responded with error: ${message}` );

                    errorCb( error );
                }
                else
                {
                    successCb( responseJson );
                }
            }
        };

        /**
         * whenever an error occurs during the request it will
         * call the error callback that is passed to the requestJSON function.
         */
        xhr.onerror = () =>
        {
            const error = new Error( `Error while loading ${url}` );
            errorCb( error );
        };

        xhr.send();
    },

    /**
     * will do a GET request to the passed url and pass the response to a given success callback
     * @param {string} url the url that needs to be called with GET method
     * @param {Function} successCb function that will be called when request was successful
     * @param {Function} errorCb function that will be called when request was not successful
     */
    get( url, successCb = console.log, errorCb = console.warn )
    {
        this._requestJSON( 'GET', url, successCb, errorCb );
    },

    /**
     * handles multiple requests and calls success function with array of the responses.
     * It will send an success message even when not all requests are done without errors
     * in order to process successful requests.
     *
     * the success callback will have two parameters like
     * `successCb( responses:Object[], withoutError:bool )`
     *
     * @param {string[]} urls a list of urls that need to be called
     * @param {function} successCb callback that will be called on successful response
     * @param {function} errorCb callback that will be called on error during the requests.
     */
    getMultiple( urls = [], successCb = console.log, errorCb = console.warn )
    {
        const requestsLength = urls.length;
        let responseCount  = 0;

        const collectedResponses = [];

        /**
         * sends the passed success callback when all xhr requests are done
         * @param {number} responseCount the current count of responses
         * @param {number} requestsLength the length of all requests that need to be done
         * @param {Object[]} collectedResponses list of all collected responses
         */
        const sendSuccessCb = ( responseCount, requestsLength, collectedResponses ) =>
        {
            if ( responseCount === requestsLength )
            {
                successCb( collectedResponses, collectedResponses.length === requestsLength );
            }
        };

        /**
         * success callback for each xhr request
         * @param {object} response response from xhr request parsed as json
         */
        const requestSuccessCb = response =>
        {
            collectedResponses.push( response );
            responseCount += 1;

            sendSuccessCb( responseCount, requestsLength, collectedResponses );
        };

        /**
         * error callback for each xhr request parsed as json
         * @param {Object} error an error object passed from _requestJSON
         */
        const requestErrorCb = error =>
        {
            responseCount += 1;

            errorCb( error );

            // need to send a success message if error happens in the last xhr call
            sendSuccessCb( responseCount, requestsLength, collectedResponses );
        };

        urls.forEach( url => this._requestJSON( 'GET', url, requestSuccessCb, requestErrorCb ) );
    },
};
