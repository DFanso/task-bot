import User, { IUser } from '../models/user';
import { UserDTO } from '../dto/userDto';

class UserService {
  public async createUser(userDTO: UserDTO): Promise<IUser> {
    const { discordId, ...update } = userDTO;
    return User.findOneAndUpdate(
      { discordId },
      { $set: update },
      { new: true, upsert: true }
    );
  }
}

export default new UserService();
