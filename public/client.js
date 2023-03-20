const {createApp} = Vue

createApp({
    data() {
        return {
            signUpEmail: '',
            signUpPassword: '',
            signInEmail: '',
            signInPassword: '',
            modalHandler: null,
            sessionId: localStorage.getItem('sessionId')

        }
    },
    methods: {

        send(method, url, data, successCallback, errorCallback) {
            // Headers to send with the request
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
            // Add the session id to the headers if it is set
            if (this.sessionId) {
                headers['Authorization'] = `Bearer ${this.sessionId}`
            }

            // Send the request
            axios({
                method,
                url,
                data,
                headers
            })
                .then(response => {
                    // Call the success callback if it was provided
                    if (successCallback) {
                        successCallback(response.data)
                    }
                })
                .catch(error => {
                    // Check if the http status code is 401
                    if (error.response.status === 401) {
                        // Sign the user out
                        this.sessionId = null;
                    }

                    // Call the error callback if it was provided
                    if (errorCallback) {
                        errorCallback(error.response.data)
                    } else {
                        alert(JSON.stringify(error.response.data))
                    }
                })
        },

        createUser() {
            this.send('post', '/users', {
                email: this.signUpEmail,
                password: this.signUpPassword
            }, () => {
                // Hide the modal
                this.modalHandler.hide();
            })
        },
        showSignUpModal() {
            this.modalHandler = new bootstrap.Modal(document.getElementById("sign-up-modal"), {});
            this.modalHandler.show();
        },
        signInUser() {
            this.send('post', '/sessions', {
                email: this.signInEmail,
                password: this.signInPassword
            }, (data) => {
                // Store the session id in localStorage
                localStorage.setItem('sessionId', data.sessionId);

                // Sign the user in
                this.sessionId = data.sessionId;

                // Hide the modal
                this.modalHandler.hide();
            })
        },
        showSignInModal() {
            this.modalHandler = new bootstrap.Modal(document.getElementById("sign-in-modal"), {});
            this.modalHandler.show();
        },
        signOut() {
            this.send('delete', '/sessions', {}, () => {
                // Remove the session id from localStorage
                localStorage.removeItem('sessionId');

                // Sign the user out
                this.sessionId = null;
            })
        }
    }
}).mount('#app')