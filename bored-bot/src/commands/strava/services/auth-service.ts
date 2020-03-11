import * as querystring from 'querystring'

import Debug from 'debug'
import User from '../db/User'
import config from '../config'
import {fetchAccessToken} from '../strava/api/accessToken'

const debug = Debug('strava:auth-service')
const urlRoot = () => config.hostname + config.basePath

/**
 * Connect URL is the URL that lets users access or connect their account through strava
 * 
 * @param user User object
 */

export async function getConnectUrl(user: User) {
  debug(`authorizing new user`)

  const tokenParams = querystring.stringify({
    token: user.discordId + "." + user.authToken
  })
  
  return `${urlRoot()}/auth?${tokenParams}`
}


/**
 * Create the URL for strava login
 * 
 * @param client_id OAuth client_id
 * @param redirect_uri Redirect URL for the strava authorization callback
 * @param state OAuth state to
 */

export function getAuthorizationUrl(client_id: string, redirect_uri: string, state: string) {
  const authParams = querystring.stringify({
    client_id, redirect_uri, state,
    response_type     : 'code',
    scope             : 'read,activity:read,profile:read_all',
    approval_prompt   : 'force'
  })

  return 'http://www.strava.com/oauth/authorize?' + authParams
}

/**
 * Validate a discord id + auth token pair
 * 
 * @param discordId 
 * @param authToken 
 */

export async function authenticate(discordId: string, authToken: string) {
  const user = await User.findById({discordId}) 

  return (user.authToken === authToken)
}

/**
 * Accepts a refresh token
 * 
 * @param discordId ID of user
 * @param code Refresh code from strava API
 */

export async function acceptToken(discordId: string, code: string) {
  const [user, result] = await Promise.all([
    User.findById({discordId}),
    fetchAccessToken(code)
  ])

  user.refreshToken = result.refresh_token;
  user.stravaId = result.athlete.id;
  
  return user.save()
}


/**
 * Creates a random 32 character string
 */

export const generateToken = () => 
  [...Array(32)].map(i=>(~~(Math.random()*36)).toString(36)).join('')
