'''
Created on Aug 26, 2015

@author: hogancama
'''
# Write a script that prompts the user for an integer tree size, then displays a number tree
import math
prompt = input("Please enter a positive integer:")
 
board = []
board_size = prompt * 2-1
for x in range(0,prompt):
    board.append([' ']* (board_size))

def print_board(board):
    for row in board:
        print ' '.join(row)

def row_result(x):
    pre_mid_nums = range(1,x)
    mid_num = [x]
    post_mid_nums = []
    for i in pre_mid_nums:
        post_mid_nums.append(len(pre_mid_nums)+1-i)
    nums = pre_mid_nums + mid_num+ post_mid_nums
    return nums

for row_num in range(1,prompt+1):
    nums = row_result(row_num)
    mid = prompt - 1
    for space_num in range(mid - int(math.floor(len(nums)/2)), mid + 1 + int(math.floor(len(nums)/2))):
        num_to_impute = space_num - (mid - int(math.floor(len(nums)/2)))
        board[row_num-1][space_num] = '%r' % nums[num_to_impute]
        
print "An integer tree of your number size looks like this:"
print_board(board)