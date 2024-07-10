import express, { Request, Response } from 'express';
import { client } from '../data/DB';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {googleAuth} from '../controller/auth-controller'
const saltRounds = 10;
const router = express.Router();
const userTable = 'users';
const JWT_SECRET = process.env.JWT_ENCRYPTION_KEY as string;
const JWT_EXPIRATION = '7d';

if (!JWT_SECRET) {
    throw new Error('JWT_ENCRYPTION_KEY environment variable is not set');
}
interface JwtPayload {
    userID: number;
    iat: number;
    exp: number;
}
router.post('/user/signup/:promotional', async (req: Request, res: Response) => {
    const userID = Math.round(Math.random() * 1000 * 1000 * 1000);
    const {promotional} = req.params;
    let dbPromotional:boolean;
    if(promotional!='false') dbPromotional=true
    else dbPromotional=false;
    const creationIP = req.ip;
    const {
        userName,
        email,
        password,
        mobile_number,
        dob
    } = req.body;
    try {
        // Check if email or mobile number already exists
        const checkQuery = `
            SELECT * FROM "${userTable}" WHERE email = $1 OR mobile_number = $2;
        `;
        const checkValues = [email, mobile_number];
        const result = await client.query(checkQuery, checkValues);

        if (result.rows.length > 0) {
            // Email or mobile number already exists
            return res.status(205).json({ error: 'Email or mobile number already exists' });
        }

        // Hash the password
        const hash = await bcrypt.hash(password, saltRounds);

        // Insert the new user
        const insertQuery = `
            INSERT INTO "${userTable}" (userID, userName, email, password, mobile_number, dob, creation_ip, role, update_ip, promotional) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'customer', $7, $8);
        `;
        const insertValues = [userID, userName, email, hash, mobile_number, dob, creationIP, dbPromotional];

        await client.query(insertQuery, insertValues);
        const token = jwt.sign(
            { userID },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRATION }
        );
        res.status(200).json({ message: 'User registered successfully',token });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/user/signin/:remember', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const {remember} = req.params;
    try {
        // Check if the email exists
        const query = `
            SELECT * FROM "${userTable}" WHERE email = $1;
        `;
        const values = [email];
        const result = await client.query(query, values);

        if (result.rows.length === 0) {
            // Email does not exist
            return res.status(205).json({ error: 'Email does not exist' });
        }

        const user = result.rows[0];

        // Check if the password matches
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            // Password does not match
            return res.status(205).json({ error: 'Incorrect password' });
        }
        const userData = {
            userName:user.username,userID: user.userid, email: user.email, mobile_number: user.mobile_number, dob: user.dob
        }
        if(remember != 'false'){
            const token = jwt.sign(
                { userID: user.userid },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRATION }
            );
            // Successful sign-in
            res.status(200).json({ message: 'Sign-in successful', token, userData });
        }else{
            // Successful sign-in
            const token = jwt.sign(
                { userID: user.userid },
                JWT_SECRET,
                { expiresIn: '1d' }
            );
            res.status(200).json({ message: 'Sign-in successful', token, userData });
        }
        
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/user/session-check', async (req: Request, res: Response) => {
    const { token } = req.body;
    try {
        const decodedJWT = jwt.verify(token, JWT_SECRET) as JwtPayload;

        const userID = decodedJWT.userID; // Access the userID from the decoded payload
        const query = `
            SELECT * FROM "${userTable}" WHERE userid = $1;
        `;
        const result = await client.query(query, [userID]);

        const user = result.rows[0];
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userData = {
            userName:user.username,
            userID: user.userid,
            email: user.email,
            mobile_number: user.mobile_number,
            dob: user.dob
        };

        res.status(200).json({ message: 'Sign-in successful', userData });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
router.post('/auth/google',async (req:Request,res:Response)=>{
    const {code} = req.body;
    try {
        const user = await googleAuth(code);
        if (!user) {
            // Email does not exist
            return res.status(205).json({ error: 'Email does not exist' });
        }
        const userData = {
            userName:user.username,userID: user.userid, email: user.email, mobile_number: user.mobile_number, dob: user.dob
        }
        const token = jwt.sign(
            { userID: user.userid },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRATION }
        );
        // Successful sign-in
        res.status(200).json({ message: 'Sign-in successful', token, userData });
    } catch (error) {
        res.status(500).json({message:'Server Error'});
    }
    
})
export default router;
