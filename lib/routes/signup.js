const { strict: assert } = require('assert');
const UserModel = require('../../db/models/User');

module.exports = async (provider, req, res, next) => {
	try {
		const interaction = await provider.interactionDetails(req, res);
		const { prompt } = interaction;
		assert.equal(prompt.name, 'sign_up');
		let result;
		if (req.body.cancel_signup) {
			interaction.params.prompt = 'login';
			await interaction.save();
			result = { sign_up: {} };
		} else {
			try {
				const newUser = new UserModel({ ...req.body });
				await newUser.save();
				interaction.params.login_hint = newUser.email;
				await interaction.save();
				result = {
					sign_up: {}
				};
			} catch (e) {
				result = { flash: 'Email is unavailable!' };
			}
		}
		await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
	} catch (err) {
		next(err);
	}
};
