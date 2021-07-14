const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth')
const user = require("../../model/User")
const jwt = require("jsonwebtoken");
const config = require("config")
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs')
router.get('/', auth, async (req, res) => {
            try {
                        const user = await User.findById(req.user.id).select('-password');
                        res.json(user)
            } catch (e) {

                        return res.status(500).send('Server error')

            }
})

router.post('/', [

            check("email", 'Please enter valid email').isEmail(),
            check("password", 'Password is required').exists()

], async (req, res) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                        return res.status(400).json({
                                    errors: errors.array()
                        })
            }
            const { email, password } = req.body;
            try {
                        let user = await User.findOne({ email });
                        if (!user) {
                                    return res.status(400).json({
                                                errors: [{ msg: "Invalid credentials" }]
                                    })
                        }

                        const payload = {
                                    user: {
                                                id: user._id
                                    }
                        }
                        const isMatch = await bcrypt.compare(password, user.password);
                        if (!isMatch) {
                                    return res.status(400).json({
                                                errors: [{ msg: "Invalid credentials" }]
                                    })
                        }



                        jwt.sign(payload, config.get('jwtSecret'),

                                    { expiresIn: Date.now() + 9999 },
                                    (err, token) => {
                                                if (err) {
                                                            throw err
                                                }
                                                res.json({ token, user })
                                    })

            }
            catch (e) {
                        console.log(e.message);
                        res.status(500).json({
                                    error: 'Server error'
                        })
            }

})


module.exports = router;