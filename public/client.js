const {createApp} = Vue

createApp({
    data() {
        return {
            email: '',
            password: '',
            signUpModal: null

        }
    },
    methods: {
        createUser() {
            axios.post('/users', {
                email: this.email,
                password: this.password
            })
                .then(response => {
                    alert(response.data)
                    this.signUpModal.hide();
                })
                .catch(error => {
                    alert(error.response.data)
                })
        },
        showSignUpModal() {
            this.signUpModal = new bootstrap.Modal(document.getElementById("sign-up-modal"), {});
            this.signUpModal.show();
        }
    }
}).mount('#app')