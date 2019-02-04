import api from '../api-gateway';

class AuthController {
    constructor() {
        this.isAuthenticated = false;
        this.user = null;
        this.url = null;
    }

    authenticate(username, password, cb) {
        api.put('/auth', { username, password }, (err, res) => {
            if (err) return cb(err);
            this.isAuthenticated = true;
            this.user = res.content.user;
            return cb(null, res);
        });
    }

    register(form, cb) {
        let user = {
            name: form.name,
            username: form.username,
            contact: { email: form.email },
            age: form.age,
            username: form.username,
            password: form.password
        };
        api.post('/users', user, (err, res) => {
            if (err) {
                if (err.status === 409) {
                    // CONFLICT - user already exists
                    err.message = 'User with the provided username already exists';
                    return cb(err);
                } else {
                    return cb(err);
                }
            }
            return this.authenticate(user.username, user.password, cb);
        });
    }

    verify(cb) {
        api.get('/auth', (err, res) => {
            if (err) return cb(err);
            this.isAuthenticated = true;
            this.user = res.user;
            cb(null);
        });
    }
}

const controller = new AuthController();

export default controller;
