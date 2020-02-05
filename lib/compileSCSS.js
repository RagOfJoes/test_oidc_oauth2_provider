module.exports = () => {
	const sass = require('node-sass');
	sass.render(
		{
			file: 'stylesheets/scss/_layout.scss'
		},
		(err, res) => {
			if (err) console.warn('SCSS compile failed!');

			console.log('SCSS compile success!');
		}
	);
};
