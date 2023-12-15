FROM alpine:latest

RUN apk add --update --no-cache ca-certificates openssl git curl hugo

ARG USER_ID=1000
ARG GROUP_ID=1000
# Change ID of vscode user and group to ID from ENV
# RUN echo "Delete user vscode" && userdel -f vscode
# RUN echo "Delete group vscode" && groupdel vscode
# RUN echo "Add new group vscode" && addgroup -g ${GROUP_ID} vscode
RUN echo "Add new user vscode" && adduser --disabled-password -u ${USER_ID} -g vscode vscode
RUN echo "Change ownership of workdir" && mkdir -p /src && chown --changes --no-dereference --recursive vscode:vscode /src

USER vscode:vscode

WORKDIR /src

EXPOSE 1313

CMD ["/usr/bin/hugo", "server", "--disableFastRender"]
