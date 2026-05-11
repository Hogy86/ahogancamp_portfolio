



def reward_function(params) :
    
    # reward = ...

    return float(reward)
	
# All reward "params" dictionary key-value pairs
# {
    # "all_wheels_on_track": Boolean,        # flag to indicate if the agent is on the track
    # "x": float,                            # agent's x-coordinate in meters
    # "y": float,                            # agent's y-coordinate in meters
    # "closest_objects": [int, int],         # zero-based indices of the two closest objects to the agent's current position of (x, y).
    # "closest_waypoints": [int, int],       # indices of the two nearest waypoints.
    # "distance_from_center": float,         # distance in meters from the track center 
    # "is_crashed": Boolean,                 # Boolean flag to indicate whether the agent has crashed.
    # "is_left_of_center": Boolean,          # Flag to indicate if the agent is on the left side to the track center or not. 
    # "is_offtrack": Boolean,                # Boolean flag to indicate whether the agent has gone off track.
    # "is_reversed": Boolean,                # flag to indicate if the agent is driving clockwise (True) or counter clockwise (False).
    # "heading": float,                      # agent's yaw in degrees
    # "objects_distance": [float, ],         # list of the objects' distances in meters between 0 and track_len.
    # "objects_heading": [float, ],          # list of the objects' headings in degrees between -180 and 180.
    # "objects_left_of_center": [Boolean, ], # list of Boolean flags indicating whether elements' objects are left of the center (True) or not (False).
    # "objects_location": [(float, float),], # list of object locations [(x,y), ...].
    # "objects_speed": [float, ],            # list of the objects' speeds in meters per second.
    # "progress": float,                     # percentage of track completed
    # "speed": float,                        # agent's speed in meters per second (m/s)
    # "steering_angle": float,               # agent's steering angle in degrees
    # "steps": int,                          # number steps completed
    # "track_length": float,                 # track length in meters.
    # "track_width": float,                  # width of the track
    # "waypoints": [(float, float), ]        # list of (x,y) as milestones along the track center

# }

# https://docs.aws.amazon.com/deepracer/latest/developerguide/deepracer-reward-function-input.html




##################################
# Rewards to consider

# Beginner:
# - all_wheels_on_track should be low if true but zero if false
# - distance_from_center should be used to calculate angle toward center within a straightaway (next N waypoints are in a row), 
    # to help get through turns (outside to inside on turn approach, inside to outside on turn exit),
# - closest_waypoints shouldn't be used directly in reward except to calculate distance to next waypoint
    # question: are all waypoints the same distance apart? 
    # If so, is it using road distance or euclidean distance?
# - is_crashed should be negative value or zero
# - is_offtrack should be negative value or zero 
# - is_reversed should be used to tell the car what direction to head
# - reward should correspond to progress amount (low at first, higher at the end) 
    # or should it be static reward across the track?

# Medium:
# - waypoints in a line have no direct affect of the car other than provide confirmation of speed and direction, 
    # in the middle of a turn the car should be between waypoint and the inner edge, 
    # leading up to a turn the car should be on the outside going inside, 
    # and exiting a turn the car should be inside going outside
# - should adjust speed for turns relative to the degree of turn and straightaways
# - track_width: need to set bounds based on track width and car width

# Hard:
# - closest_objects should be low if above some threshold else zero
# - heading in relation to x axis and the road
# - should avoid stationary obstacles

# Pro:
# - distance_from_center should help dodge objects
# - should manuever around moving objects
# - closest_objects should be low if above some distance threshold for stationary objects 
    # or another distance threshold for moving objects 
    # else if too close then zero

##################################