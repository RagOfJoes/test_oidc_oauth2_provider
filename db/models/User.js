import { pick } from 'lodash';
import { ObjectID } from 'mongodb';
import * as bcrypt from 'bcryptjs';
import { Schema, model as mongooseModel } from 'mongoose';

const schema = new Schema({
	username: String,
	first_name: String,
	last_name: String,
	birthdate: Date,
	profile_picture: String,
	email: {
		type: String,
		required: true,
		minlength: 1,
		trim: true,
		unique: true
	},
	email_verified: {
		type: Boolean,
		default: false
	},
	password: {
		type: String,
		minlength: 6
	},
	federation: {
		id: String,
		token: String,
		tokenExpire: Date,
		rtToken: String,
		rtTokenExpire: Date
	},
	isFederated: {
		type: Boolean,
		default: false
	},
	roles: [ObjectID],
	logins: [String]
});

schema.pre('save', function(next) {
	const user = this;

	if (!user.isFederated && (!user.password || user.password.length < 6)) {
		throw new Error('Password field is missing');
	} else if (user.isFederated) {
		next();
		return;
	}
	if (user.isModified('password')) {
		bcrypt.genSalt(10, (err, salt) => {
			bcrypt.hash(user.password, salt, (err, hash) => {
				if (!err) {
					user.password = hash;
				}
				next();
			});
		});
	} else {
		next();
	}
});

schema.virtual('accountId').get(function(this) {
	return this._id.toString();
});

schema.virtual('id').get(function(this) {
	return this._id.toString();
});

schema.methods.toJSON = function() {
	var user = this;
	var userObject = user.toObject();

	return pick(userObject, ['_id', 'email']);
};

// claims() should return or resolve with an object with claims that are mapped 1:1 to
// what your OP supports, oidc-provider will cherry-pick the requested ones automatically
schema.methods.claims = function() {
	return Object.assign({}, this._doc, {
		sub: this._id.toString()
	});
};

export let UserSchema = mongooseModel > ('User', schema);

// MODEL
export class UserModel {
	constructor(userModel) {
		this._userModel = userModel;
	}

	get id() {
		return this._userModel.id;
	}

	get firstname() {
		return this._userModel.first_name;
	}

	get lastname() {
		return this._userModel.last_name;
	}

	get fullname() {
		return this._userModel.full_name;
	}

	get email() {
		return this._userModel.email;
	}

	get birthdate() {
		return this._userModel.birthdate;
	}

	get emailVerified() {
		return this._userModel.email_verified;
	}

	get password() {
		return this._userModel.email;
	}

	get roles() {
		return this._userModel.roles;
	}

	get logins() {
		return this._userModel.logins;
	}

	async claims(use, scope, claims, rejected) {
		return Object.assign({}, this._userModel, {
			sub: this._userModel.id
		});
	}

	static async createUser(email, password) {
		try {
			const userInstance = new UserSchema({ email, password });
			userInstance.save();
			return userInstance.toJSON();
		} catch (e) {
			throw new Error(e);
		}
	}

	static async createByFederation(provider, data) {
		try {
			const userInstance = new UserSchema({ email: data.email });
			userInstance.federation = {
				id: `${provider}.${userInstance.id}`,
				token: data.token,
				tokenExpire: new Date(),
				rtToken: data.refresh_token,
				rtTokenExpire: new Date()
			};
			userInstance.save();
			return userInstance.toJSON();
		} catch (e) {
			throw new Error(e);
		}
	}

	static async findByID(ctx, id) {
		try {
			const user = await UserSchema.findById(id);
			return user;
		} catch (e) {
			throw new Error(e);
		}
	}

	static async findAccount(ctx, sub, token) {
		try {
			const user = await UserSchema.findById(sub);
			if (!user) throw new Error('User not found');
			const account = UserModel.getAccount(user);
			return account;
		} catch (e) {
			throw new Error(e);
		}
	}

	static async findByCredentials(email, password) {
		try {
			const user = await UserSchema.findOne({ email });
			if (!user) {
				throw new Error('Credentials not valid');
			}
			const isvalid = await bcrypt.compare(password, user.password);
			if (!isvalid) {
				throw new Error('Credentials not valid');
			}
			return user;
		} catch (e) {
			throw new Error(e);
		}
	}

	static async findByFederated(provider, claims) {
		const id = `${provider}.${claims.sub}`;
		// if (!logins.get(id)) {
		//     logins.set(id, new Account(id, claims));
		// }
		// return logins.get(id);
	}

	static async findByLogin(login) {
		try {
			const users = await UserSchema.find({ email: login });
			if (!users || users.length !== 1) throw new Error('User not found');
			const user = users[0];
			const account = UserModel.getAccount(user);
			return account;
		} catch (e) {
			throw new Error(e);
		}
	}

	static getAccount(user) {
		const account = {
			accountId: user.id,
			claims: (use, scope, claims) => {
				const claimsKeys = Object.keys(claims).filter(key => !rejected.includes(key));
				const accountClaims = {
					sub: user.id
				};
				claimsKeys.map(key => {
					const keyObject = claims[key];
					if (keyObject) {
						accountClaims[key] = keyObject.value || keyObject.values;
					}
				});
				return accountClaims;
			}
		};
		return account;
	}
}

Object.seal(UserModel);
