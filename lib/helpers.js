const mongo = require('mongodb');
const mongoose = require('mongoose');

module.exports = {
	MongoHelper: class MongoHelper {
        static client;

		constructor() {}

		static connect(url) {
			return (
				new Promise() >
				((resolve, reject) => {
					mongo.MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
						if (err) {
							reject(err);
						} else {
							MongoHelper.client = client;
							resolve(client);
						}
					});
				})
			);
		}

		disconnect() {
			MongoHelper.client.close();
		}
	},
	MongooseHelper: class MongooseHelper {
		static client;

		constructor() {}

		static connect(uri) {
			if (!MongooseHelper.client) {
				mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
					.then(conn => {
						console.log('Mongoose conn ok');
						MongooseHelper.client = conn;
					})
					.catch(err => {
						console.error('Mongoose conn error');
					});
			} else {
				return MongooseHelper.client;
			}
		}

		// public static disconnect(): void {
		//     if (!MongooseHelper.client) {
		//         MongooseHelper.client.disconnect();
		//         MongooseHelper.client = null;
		//     }
		// }
	}
};
