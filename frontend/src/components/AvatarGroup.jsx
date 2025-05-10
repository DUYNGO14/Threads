import { Avatar, AvatarGroup } from "@chakra-ui/react"

const ShowAvatarGroup = ({ users }) => {
    return (
        <AvatarGroup size='sm' max={2}>
            {users.map((user) => (
                <Avatar key={user._id} name={user.username} src={user.profilePic} />
            ))}
        </AvatarGroup>
    )
}

export default ShowAvatarGroup