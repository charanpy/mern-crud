const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth')
const Profile = require('../../model/Profile')
const User = require('../../model/User')
const { check, validationResult } = require('express-validator')
router.get('/me', auth, async (req, res) => {
            try {
                        const profile = await Profile.findOne({ user: req.user.id }).populate('User', ['name', 'avatar'])

                        if (!profile) {
                                    return res.status(400).json({
                                                msg: 'There is no profile '
                                    })
                        }
                        res.json(profile)
            } catch (e) {
                        console.log(e.message);
                        res.status(500).send('server error')
            }
})

router.post('/', [auth, [
            check('status', 'Status is empty').not().isEmpty(),
            check('skills', 'Skills is required').not().isEmpty()
]], async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                        return res.status(400).json({
                                    errors: errors.array()
                        })
            }
            const { company, website, location,
                        bio, status, githubusername, skills, youtube, facebook, twitter, instagram, linkedin } = req.body;
            //Build social objects

            const profileFields = {}
            profileFields.user = req.user.id;
            if (company) profileFields.company = company;
            if (website) profileFields.website = website;
            if (location) profileFields.location = location;
            if (bio) profileFields.bio = bio;
            if (status) profileFields.status = status;
            if (githubusername) profileFields.githubusername = githubusername;
            if (skills) {
                        profileFields.skills = skills.toString().split(',').map(skill => skill.trim())

            }

            //Build social object
            profileFields.social = {}
            if (twitter) profileFields.social.twitter = twitter;
            if (youtube) profileFields.social.youtube = youtube;
            if (facebook) profileFields.social.facebook = facebook;
            if (linkedin) profileFields.social.linkedin = linkedin;
            if (instagram) profileFields.social.instagram = instagram;

            try {
                        let profile = await Profile.findOne({ user: req.user.id })
                        if (profile) {

                                    profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields },
                                                { new: true })

                                    return res.json(profile)
                        }
                        //create
                        profile = new Profile(profileFields)
                        await profile.save();
                        return res.json(profile)
            } catch (e) {
                        res.status(500).send('Server error')
            }

})

//get all profile
router.get('/', async (req, res) => {
            try {
                        const profiles = await Profile.find().populate('user', ['name', 'avatar'])
                        res.json(profiles)
            } catch (e) {
                        res.status(500).send('Server error')
            }
})
router.get('/user/:userId', async (req, res) => {
            try {
                        const profiles = await Profile.findOne({ user: req.params.userId }).populate('user', ['name', 'avatar'])
                        if (!profiles) {
                                    return res.status(400).json({
                                                errors: 'No user found'
                                    })
                        }
                        res.json(profiles)
            } catch (e) {
                        console.log(e.message)
                        if (e.kind == 'ObjectId') {
                                    return res.status(400).json({
                                                errors: 'Profile not found'
                                    })
                        }
                        res.status(500).send('Server error')
            }
})
//Delete profile,users and posts
router.delete('/', auth, async (req, res) => {
            try {
                        //Remove profile
                        await Profile.findOneAndRemove({ user: req.user.id })
                        //Remove user
                        await User.findOneAndRemove({ _id: req.user.id })
                        res.json({ msg: 'User deleted' })
            } catch (e) {
                        console.log(e)
                        res.status(500).send('Server error')
            }
})
//update education
router.put("/education", [auth, [
            check('school', "Title is required").not().isEmpty(),
            check('degree', "Degree is required").not().isEmpty(),
            check('fieldofstudy', "Fieldofstudy is required").not().isEmpty(),
            check('from', "From date is required").not().isEmpty()
]], async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                        return res.status(400).json({
                                    errors: errors.array()
                        })

            }

            const {
                        school,
                        degree,
                        fieldofstudy,
                        from,
                        to,
                        current,
                        description
            } = req.body;

            const newEdu = {
                        school,
                        degree,
                        fieldofstudy,
                        from,
                        to,
                        current,
                        description

            }
            try {
                        const profile = await Profile.findOne({ user: req.user.id })
                        profile.education.unshift(newEdu)
                        await profile.save();
                        res.json(profile)
            } catch (err) {
                        console.error(err.message);
                        res.status(500).send("Server error")
            }


})

//delete exp from profile
router.delete('/education/:edu_id', auth, async (req, res) => {
            try {
                        const profile = await Profile.findOne({ user: req.user.id });

                        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id)
                        profile.education.splice(removeIndex, 1)
                        await profile.save();
                        res.json(profile)
            } catch (err) {
                        console.error(err.message);
                        res.status(500).send("Server error")
            }
})
//exp

router.put(
            '/experience',
            [auth, [
                        check('title', "Title is required").not().isEmpty(),
                        check('company', "company is required").not().isEmpty(),
                        check('location', "location is required").not().isEmpty(),
                        check('from', "From date is required").not().isEmpty()
            ]],
            (req, res) => {
                        const errors = validationResult(req);
                        if (!errors.isEmpty()) {
                                    return res.status(400).json({
                                                errors: errors.array()
                                    })

                        }

                        Profile.findOne({ user: req.user.id }).then(profile => {
                                    const newExp = {
                                                title: req.body.title,
                                                company: req.body.company,
                                                location: req.body.location,
                                                from: req.body.from,
                                                to: req.body.to,
                                                current: req.body.current,
                                                description: req.body.description
                                    };

                                    // Add to exp array
                                    profile.experience.unshift(newExp);

                                    profile.save().then(profile => res.json(profile));
                        });
            }
);

//delete exp
router.delete('/experience/:edu_id', auth, async (req, res) => {
            try {
                        const profile = await Profile.findOne({ user: req.user.id });

                        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.edu_id)
                        profile.experience.splice(removeIndex, 1)
                        await profile.save();
                        res.json(profile)
            } catch (err) {
                        console.error(err.message);
                        res.status(500).send("Server error")
            }
})


//github
const request = require('request');
const config = require('config')
router.get('/github/:username', (req, res) => {
            try {
                        const options = {
                                    uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClient')}&client_secret=${config.get('githubSecret')}}`,
                                    method: 'GET',
                                    headers: { 'user-agent': 'node.js' }
                        }
                        request(options, (error, response, body) => {
                                    if (error) {
                                                console.error(error)
                                    } if (response.statusCode !== 200) {
                                                return res.status(404).json({ msg: 'No github profile found' })
                                    }
                                    res.json(JSON.parse(body))
                        })

            } catch (err) {
                        console.log(err.message);
                        res.status(500).send('Server error')
            }
})
module.exports = router;